<!-- src/pages/TargetsPage.vue -->
<template>
  <div class="page-root">

    <PageHeader title="مدیریت اهداف" subtitle="تعریف و مدیریت اهداف برنامه عملیاتی" icon="track_changes">
      <q-btn unelevated color="primary" icon="add" label="هدف جدید" @click="openDialog()" />
    </PageHeader>

    <div class="filter-bar">
      <q-input
        v-model="search"
        outlined
        dense
        placeholder="جستجو در عنوان یا کد هدف..."
        clearable
        style="max-width:320px"
        @update:model-value="handleSearch"
      >
        <template #prepend><q-icon name="search" size="18px" color="grey-5" /></template>
      </q-input>
      <q-select
        v-model="yearFilter"
        outlined
        dense
        :options="yearOpts"
        label="سال"
        clearable
        style="min-width:140px"
        @update:model-value="handleYearFilter"
      />
      <span class="stat-chip">{{ pagination.total }} هدف</span>
    </div>

    <SortableTable :columns="columns" :rows="rows" empty-icon="track_changes" empty-text="هدفی یافت نشد" default-sort="title" :loading="loading">
      <template #default="{ row, index }">
        <td class="text-center">{{ (pagination.current_page - 1) * pagination.per_page + index + 1 }}</td>
        <td><code class="code-chip">{{ row.code }}</code></td>
        <td><span class="row-name">{{ row.title }}</span></td>
        <td class="date-cell">{{ row.year }}</td>
        <td>
          <div class="prog-wrap">
            <div class="prog-track"><div class="prog-fill" :style="{ width: (row.progress || 0) + '%' }"></div></div>
            <span class="prog-text">{{ row.progress || 0 }}%</span>
          </div>
        </td>
        <td>
          <span class="count-badge">
            <q-icon name="event_note" size="13px" class="q-ml-xs" />{{ row.programs_count || 0 }}
          </span>
        </td>
        <td>
          <div class="action-btns">
            <button class="act-btn act-view"   @click="viewPrograms(row)" title="برنامه‌ها"><q-icon name="list" size="16px" /></button>
            <button class="act-btn act-edit"   @click="openDialog(row)"   title="ویرایش"><q-icon name="edit" size="16px" /></button>
            <button class="act-btn act-delete" @click="deleteRow(row)"    title="حذف"><q-icon name="delete_outline" size="16px" /></button>
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
        {{ pagination.total }} هدف
      </span>
    </div>

    <!-- دیالوگ ایجاد/ویرایش -->
    <q-dialog v-model="dialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>{{ editing ? 'ویرایش هدف' : 'هدف جدید' }}</h3>
          <button class="dialog-close" @click="dialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">
          <div class="form-row">
            <div class="form-group">
              <label>کد هدف <span class="req">*</span></label>
              <q-input v-model="form.code" outlined dense hide-bottom-space />
            </div>
            <div class="form-group">
              <label>سال اجرا <span class="req">*</span></label>
              <q-select v-model="form.year" outlined dense :options="yearOpts" />
            </div>
          </div>
          <div class="form-group">
            <label>عنوان هدف <span class="req">*</span></label>
            <q-input v-model="form.title" outlined dense hide-bottom-space />
          </div>
          <div class="form-group">
            <label>توضیحات</label>
            <q-input v-model="form.description" outlined dense type="textarea" rows="3" />
          </div>
        </div>
        <div class="dialog-foot">
          <q-btn flat label="انصراف" @click="dialog=false" />
          <q-btn unelevated color="primary" :label="editing ? 'ذخیره' : 'ایجاد'" @click="save" :loading="saving" />
        </div>
      </div>
    </q-dialog>

    <!-- دیالوگ برنامه‌ها -->
    <q-dialog v-model="programsDialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>برنامه‌های هدف: {{ selectedTarget?.title }}</h3>
          <button class="dialog-close" @click="programsDialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">
          <div class="sub-list" v-if="targetPrograms.length > 0">
            <div class="sub-item" v-for="p in targetPrograms" :key="p.id">
              <div class="sub-icon"><q-icon name="event_note" size="16px" /></div>
              <div class="sub-info">
                <span class="sub-name">{{ p.title }}</span>
                <span class="sub-meta">{{ p.code }}</span>
              </div>
              <div class="prog-wrap" style="min-width:100px">
                <div class="prog-track"><div class="prog-fill" :style="{ width: (p.progress || 0) + '%' }"></div></div>
                <span class="prog-text">{{ p.progress || 0 }}%</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-programs">
            <q-icon name="info" size="32px" color="grey-4" />
            <p>برنامه‌ای برای این هدف تعریف نشده است</p>
          </div>
        </div>
        <div class="dialog-foot">
          <q-btn flat label="بستن" @click="programsDialog=false" />
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
    const yearFilter = ref(null)
    const dialog = ref(false)
    const programsDialog = ref(false)
    const editing = ref(null)
    const selectedTarget = ref(null)
    const loading = ref(false)
    const saving = ref(false)
    const rows = ref([])
    const targetPrograms = ref([])

    // Pagination state
    const pagination = ref({
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0
    })

    const yearOpts = ['1403', '1404', '1405', '1406']

    const columns = [
      { key: 'index', label: '#', sortable: false },
      { key: 'code', label: 'کد هدف', sortable: true },
      { key: 'title', label: 'عنوان هدف', sortable: true },
      { key: 'year', label: 'سال', sortable: true },
      { key: 'progress', label: 'پیشرفت', sortable: true },
      { key: 'programs_count', label: 'برنامه‌ها', sortable: true },
      { key: 'actions', label: 'عملیات', sortable: false },
    ]

    const emptyForm = () => ({
      code: '',
      title: '',
      year: '',
      description: ''
    })
    const form = ref(emptyForm())

    // ============================================================
    // دریافت لیست اهداف از API با صفحه‌بندی
    // ============================================================
    const fetchTargets = async () => {
      loading.value = true
      try {
        let url = `/targets?page=${pagination.value.current_page}&per_page=${pagination.value.per_page}`

        if (search.value) {
          url += `&search=${encodeURIComponent(search.value)}`
        }
        if (yearFilter.value) {
          url += `&year=${yearFilter.value}`
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
            message: response.data.message || 'خطا در دریافت اهداف',
            position: 'top'
          })
        }
      } catch (error) {
        console.error('Fetch targets error:', error)
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
    // دریافت برنامه‌های یک هدف
    // ============================================================
    const fetchTargetPrograms = async (targetId) => {
      try {
        const response = await api.get(`/targets/${targetId}`)
        if (response.data.success) {
          targetPrograms.value = response.data.data.programs || []
        }
      } catch (error) {
        console.error('Fetch target programs error:', error)
        targetPrograms.value = []
      }
    }

    // ============================================================
    // جستجو
    // ============================================================
    const handleSearch = () => {
      pagination.value.current_page = 1
      fetchTargets()
    }

    // ============================================================
    // فیلتر بر اساس سال
    // ============================================================
    const handleYearFilter = () => {
      pagination.value.current_page = 1
      fetchTargets()
    }

    // ============================================================
    // رفتن به صفحه مشخص
    // ============================================================
    const goToPage = (page) => {
      pagination.value.current_page = page
      fetchTargets()
    }

    // ============================================================
    // باز کردن دیالوگ (ایجاد یا ویرایش)
    // ============================================================
    const openDialog = (row = null) => {
      editing.value = row
      if (row) {
        form.value = {
          code: row.code,
          title: row.title,
          year: row.year,
          description: row.description || ''
        }
      } else {
        form.value = emptyForm()
      }
      dialog.value = true
    }

    // ============================================================
    // مشاهده برنامه‌های هدف
    // ============================================================
    const viewPrograms = async (row) => {
      selectedTarget.value = row
      await fetchTargetPrograms(row.id)
      programsDialog.value = true
    }

    // ============================================================
    // ذخیره هدف (ایجاد یا ویرایش)
    // ============================================================
    const save = async () => {
      if (!form.value.code || !form.value.title || !form.value.year) {
        $q.notify({
          type: 'negative',
          message: 'کد، عنوان و سال الزامی هستند',
          position: 'top'
        })
        return
      }

      saving.value = true

      try {
        if (editing.value) {
          // ویرایش هدف
          const response = await api.put(`/targets/${editing.value.id}`, form.value)

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'هدف با موفقیت ویرایش شد',
              position: 'top'
            })
            await fetchTargets()
            dialog.value = false
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در ویرایش هدف',
              position: 'top'
            })
          }
        } else {
          // ایجاد هدف جدید
          const response = await api.post('/targets', form.value)

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'هدف جدید با موفقیت ایجاد شد',
              position: 'top'
            })
            await fetchTargets()
            dialog.value = false
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در ایجاد هدف',
              position: 'top'
            })
          }
        }
      } catch (error) {
        console.error('Save target error:', error)

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
    // حذف هدف
    // ============================================================
    const deleteRow = (row) => {
      $q.dialog({
        title: 'حذف هدف',
        message: `آیا از حذف "${row.title}" مطمئنید؟`,
        cancel: { label: 'انصراف', flat: true },
        ok: { label: 'حذف', color: 'negative', unelevated: true },
        persistent: true
      }).onOk(async () => {
        try {
          const response = await api.delete(`/targets/${row.id}`)

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'هدف با موفقیت حذف شد',
              position: 'top'
            })
            await fetchTargets()
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در حذف هدف',
              position: 'top'
            })
          }
        } catch (error) {
          console.error('Delete target error:', error)
          $q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'خطا در حذف هدف',
            position: 'top'
          })
        }
      })
    }

    // ============================================================
    // بارگذاری اولیه
    // ============================================================
    onMounted(() => {
      fetchTargets()
    })

    return {
      search,
      yearFilter,
      dialog,
      programsDialog,
      editing,
      selectedTarget,
      loading,
      saving,
      rows,
      form,
      targetPrograms,
      yearOpts,
      columns,
      pagination,
      openDialog,
      viewPrograms,
      save,
      deleteRow,
      goToPage,
      handleSearch,
      handleYearFilter
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

.count-badge { font-size: 12px; color: #64748b; display: flex; align-items: center; }
.sub-list { display: flex; flex-direction: column; gap: 8px; }
.sub-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: 10px;
  background: #f8fafc; border: 1px solid #f1f5f9;
}
.sub-icon {
  width: 32px; height: 32px; border-radius: 8px;
  background: #ecfdf5; color: #1e8a5e;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.sub-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.sub-name { font-size: 13px; font-weight: 600; color: #1e293b; }
.sub-meta { font-size: 11.5px; color: #94a3b8; }
.empty-programs {
  text-align: center;
  padding: 32px;
  color: #94a3b8;
  p { margin-top: 8px; font-size: 13px; }
}
</style>
