<!-- src/pages/UnitsPage.vue -->
<template>
  <div class="page-root">

    <PageHeader
      title="مدیریت واحدها"
      subtitle="ایجاد، ویرایش و حذف واحدهای قضایی و اداری"
      icon="corporate_fare"
    >
      <q-btn unelevated color="primary" icon="add" label="واحد جدید" @click="openDialog()" />
    </PageHeader>

    <!-- فیلتر -->
    <div class="filter-bar">
      <q-input
        v-model="search"
        outlined
        dense
        placeholder="جستجو در نام یا کد واحد..."
        clearable
        style="max-width:320px"
        @update:model-value="handleSearch"
      >
        <template #prepend><q-icon name="search" size="18px" color="grey-5" /></template>
      </q-input>
      <span class="stat-chip">{{ pagination.total }} واحد</span>
    </div>

    <!-- جدول با قابلیت مرتب‌سازی -->
    <SortableTable
      :columns="columns"
      :rows="rows"
      empty-icon="corporate_fare"
      empty-text="واحدی یافت نشد"
      default-sort="name"
      :loading="loading"
    >
      <template #default="{ row, index }">
        <td>{{ (pagination.current_page - 1) * pagination.per_page + index + 1 }}</td>
        <td><span class="row-name">{{ row.name }}</span></td>
        <td><code class="code-chip">{{ row.code }}</code></td>
        <td class="desc-cell">{{ row.description || '—' }}</td>
        <td>
          <span class="status-badge" :class="row.is_active ? 'badge-active' : 'badge-inactive'">
            {{ row.is_active ? 'فعال' : 'غیرفعال' }}
          </span>
        </td>
        <td>{{ formatDate(row.created_at) }}</td>
        <td>
          <div class="action-btns">
            <button class="act-btn act-edit"   @click="openDialog(row)" title="ویرایش"><q-icon name="edit" size="16px" /></button>
            <button class="act-btn act-delete" @click="deleteRow(row)"  title="حذف"><q-icon name="delete_outline" size="16px" /></button>
          </div>
        </td>
      </template>
    </SortableTable>

    <!-- Pagination -->
    <div class="pagination-wrapper" v-if="pagination.last_page > 1">
      <q-pagination
        v-model="pagination.current_page"
        :max="pagination.last_page"
        :max-pages="5"
        direction-links
        boundary-links
        @update:model-value="goToPage"
      />
      <span class="pagination-info">
        نمایش {{ ((pagination.current_page - 1) * pagination.per_page) + 1 }} تا
        {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }} از
        {{ pagination.total }} واحد
      </span>
    </div>

    <!-- دیالوگ -->
    <q-dialog v-model="dialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>{{ editing ? 'ویرایش واحد' : 'واحد جدید' }}</h3>
          <button class="dialog-close" @click="dialog = false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">
          <div class="form-row">
            <div class="form-group">
              <label>نام واحد <span class="req">*</span></label>
              <q-input v-model="form.name" outlined dense hide-bottom-space />
            </div>
            <div class="form-group">
              <label>کد واحد <span class="req">*</span></label>
              <q-input v-model="form.code" outlined dense hide-bottom-space />
            </div>
          </div>
          <div class="form-group">
            <label>توضیحات</label>
            <q-input v-model="form.description" outlined dense type="textarea" rows="3" />
          </div>
          <q-toggle v-model="form.is_active" label="واحد فعال است" color="primary" />
        </div>
        <div class="dialog-foot">
          <q-btn flat label="انصراف" @click="dialog = false" />
          <q-btn unelevated color="primary" :label="editing ? 'ذخیره تغییرات' : 'ایجاد واحد'" @click="save" :loading="saving" />
        </div>
      </div>
    </q-dialog>

  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import PageHeader from 'components/PageHeader.vue'
import SortableTable from 'components/SortableTable.vue'

export default {
  components: { PageHeader, SortableTable },
  setup () {
    const $q = useQuasar()
    const search = ref('')
    const dialog = ref(false)
    const editing = ref(null)
    const loading = ref(false)
    const saving = ref(false)
    const rows = ref([])

    // Pagination state
    const pagination = ref({
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0
    })

    // تعریف ستون‌ها برای SortableTable
    const columns = [
      { key: 'index', label: '#', sortable: false },
      { key: 'name', label: 'نام واحد', sortable: true },
      { key: 'code', label: 'کد واحد', sortable: true },
      { key: 'description', label: 'توضیحات', sortable: false },
      { key: 'is_active', label: 'وضعیت', sortable: true, getValue: r => r.is_active ? 'فعال' : 'غیرفعال' },
      { key: 'created_at', label: 'تاریخ ایجاد', sortable: true },
      { key: 'actions', label: 'عملیات', sortable: false },
    ]

    // فرم خالی
    const emptyForm = () => ({
      name: '',
      code: '',
      description: '',
      is_active: true
    })
    const form = ref(emptyForm())

    // ============================================================
    // توابع کمکی
    // ============================================================
    const formatDate = (dateString) => {
      if (!dateString) return '—'
      const date = new Date(dateString)
      return date.toLocaleDateString('fa-IR')
    }

    // ============================================================
    // دریافت لیست واحدها از API با صفحه‌بندی
    // ============================================================
    const fetchUnits = async () => {
      loading.value = true
      try {
        let url = `/units?page=${pagination.value.current_page}&per_page=${pagination.value.per_page}`

        if (search.value) {
          url += `&search=${encodeURIComponent(search.value)}`
        }

        const response = await api.get(url)

        if (response.data.success) {
          rows.value = response.data.data
          pagination.value = {
            current_page: response.data.pagination.current_page,
            last_page: response.data.pagination.last_page,
            per_page: response.data.pagination.per_page,
            total: response.data.pagination.total
          }
        } else {
          $q.notify({
            type: 'negative',
            message: response.data.message || 'خطا در دریافت واحدها',
            position: 'top'
          })
        }
      } catch (error) {
        console.error('Fetch units error:', error)
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'خطا در ارتباط با سرور',
          position: 'top'
        })
      } finally {
        loading.value = false
      }
    }

    // ============================================================
    // جستجو
    // ============================================================
    const handleSearch = () => {
      pagination.value.current_page = 1
      fetchUnits()
    }

    // ============================================================
    // رفتن به صفحه مشخص
    // ============================================================
    const goToPage = (page) => {
      pagination.value.current_page = page
      fetchUnits()
    }

    // ============================================================
    // باز کردن دیالوگ (ایجاد یا ویرایش)
    // ============================================================
    const openDialog = (row = null) => {
      editing.value = row
      if (row) {
        form.value = {
          name: row.name,
          code: row.code,
          description: row.description || '',
          is_active: row.is_active
        }
      } else {
        form.value = emptyForm()
      }
      dialog.value = true
    }

    // ============================================================
    // ذخیره (ایجاد یا ویرایش)
    // ============================================================
    const save = async () => {
      if (!form.value.name || !form.value.code) {
        $q.notify({
          type: 'negative',
          message: 'نام و کد واحد الزامی هستند',
          position: 'top'
        })
        return
      }

      saving.value = true

      try {
        if (editing.value) {
          // ویرایش واحد
          const response = await api.put(`/units/${editing.value.id}`, {
            name: form.value.name,
            code: form.value.code,
            description: form.value.description,
            is_active: form.value.is_active
          })

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'واحد با موفقیت ویرایش شد',
              position: 'top'
            })
            await fetchUnits()
            dialog.value = false
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در ویرایش واحد',
              position: 'top'
            })
          }
        } else {
          // ایجاد واحد جدید
          const response = await api.post('/units', {
            name: form.value.name,
            code: form.value.code,
            description: form.value.description,
            is_active: form.value.is_active
          })

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'واحد جدید با موفقیت ایجاد شد',
              position: 'top'
            })
            await fetchUnits()
            dialog.value = false
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در ایجاد واحد',
              position: 'top'
            })
          }
        }
      } catch (error) {
        console.error('Save unit error:', error)

        if (error.response?.status === 422 && error.response?.data?.errors) {
          const errors = error.response.data.errors
          const firstError = Object.values(errors)[0]?.[0]
          $q.notify({
            type: 'negative',
            message: firstError || 'خطا در اعتبارسنجی اطلاعات',
            position: 'top'
          })
        } else {
          $q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'خطا در ارتباط با سرور',
            position: 'top'
          })
        }
      } finally {
        saving.value = false
      }
    }

    // ============================================================
    // حذف واحد
    // ============================================================
    const deleteRow = (row) => {
      $q.dialog({
        title: 'حذف واحد',
        message: `آیا از حذف "${row.name}" مطمئنید؟`,
        cancel: { label: 'انصراف', flat: true },
        ok: { label: 'حذف', color: 'negative', unelevated: true },
        persistent: true
      }).onOk(async () => {
        try {
          const response = await api.delete(`/units/${row.id}`)

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'واحد با موفقیت حذف شد',
              position: 'top'
            })
            await fetchUnits()
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در حذف واحد',
              position: 'top'
            })
          }
        } catch (error) {
          console.error('Delete unit error:', error)
          $q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'خطا در حذف واحد',
            position: 'top'
          })
        }
      })
    }

    // ============================================================
    // بارگذاری اولیه
    // ============================================================
    onMounted(() => {
      fetchUnits()
    })

    return {
      search,
      dialog,
      editing,
      loading,
      saving,
      rows,
      form,
      columns,
      pagination,
      formatDate,
      openDialog,
      save,
      deleteRow,
      goToPage,
      handleSearch
    }
  }
}
</script>

<style lang="scss" scoped>
@import './page-shared.scss';

.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 10px 0;

  .pagination-info {
    font-size: 13px;
    color: #64748b;
  }
}
</style>
