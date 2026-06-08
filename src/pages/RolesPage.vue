<!-- src/pages/RolesPage.vue -->
<template>
  <div class="page-root">

    <PageHeader title="مدیریت نقش‌ها" subtitle="تعریف نقش‌ها و سطوح دسترسی سامانه" icon="manage_accounts">
      <q-btn unelevated color="primary" icon="add" label="نقش جدید" @click="openDialog()" />
    </PageHeader>

    <div class="filter-bar">
      <q-input
        v-model="search"
        outlined
        dense
        placeholder="جستجو در نام یا کد نقش..."
        clearable
        style="max-width:320px"
        @update:model-value="handleSearch"
      >
        <template #prepend><q-icon name="search" size="18px" color="grey-5" /></template>
      </q-input>
      <span class="stat-chip">{{ pagination.total }} نقش</span>
    </div>

    <SortableTable :columns="columns" :rows="rows" empty-icon="manage_accounts" empty-text="نقشی یافت نشد" default-sort="name" :loading="loading">
      <template #default="{ row, index }">
        <td>{{ (pagination.current_page - 1) * pagination.per_page + index + 1 }}</td>
        <td><span class="row-name">{{ row.name }}</span></td>
        <td><code class="code-chip">{{ row.code }}</code></td>
        <td><span class="status-badge badge-info">{{ row.type }}</span></td>
        <td>{{ row.description || '—' }}</td>
        <td>{{ row.users_count || 0 }} کاربر</td>
        <td>
          <div class="action-btns">
            <button class="act-btn act-edit"   @click="openDialog(row)" title="ویرایش"><q-icon name="edit" size="16px" /></button>
            <button class="act-btn act-assign" @click="openPerms(row)"  title="دسترسی‌ها"><q-icon name="key" size="16px" /></button>
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
        {{ pagination.total }} نقش
      </span>
    </div>

    <!-- دیالوگ ایجاد/ویرایش -->
    <q-dialog v-model="dialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>{{ editing ? 'ویرایش نقش' : 'نقش جدید' }}</h3>
          <button class="dialog-close" @click="dialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">
          <div class="form-row">
            <div class="form-group">
              <label>نام نقش <span class="req">*</span></label>
              <q-input v-model="form.name" outlined dense hide-bottom-space />
            </div>
            <div class="form-group">
              <label>کد نقش <span class="req">*</span></label>
              <q-input v-model="form.code" outlined dense hide-bottom-space />
            </div>
          </div>
          <div class="form-group">
            <label>نوع نقش</label>
            <q-select v-model="form.type" outlined dense :options="typeOpts" />
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

    <!-- دیالوگ دسترسی‌ها -->
    <q-dialog v-model="permsDialog" persistent>
      <div class="form-dialog-lg">
        <div class="dialog-head">
          <h3>دسترسی‌های نقش: {{ selectedRole?.name }}</h3>
          <button class="dialog-close" @click="permsDialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">
          <div class="perms-grid">
            <div v-for="p in permissions" :key="p.id" class="perm-item">
              <div class="perm-info">
                <span class="perm-name">{{ p.name }}</span>
                <span class="perm-desc">{{ p.desc }}</span>
              </div>
              <q-toggle v-model="selectedPerms[p.id]" color="primary" dense />
            </div>
          </div>
        </div>
        <div class="dialog-foot">
          <q-btn flat label="انصراف" @click="permsDialog=false" />
          <q-btn unelevated color="primary" label="ذخیره دسترسی‌ها" @click="savePerms" :loading="savingPerms" />
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
    const permsDialog = ref(false)
    const editing = ref(null)
    const selectedRole = ref(null)
    const selectedPerms = ref({})
    const loading = ref(false)
    const saving = ref(false)
    const savingPerms = ref(false)
    const rows = ref([])

    // Pagination state
    const pagination = ref({
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0
    })

    const columns = [
      { key: 'index', label: '#', sortable: false },
      { key: 'name', label: 'نام نقش', sortable: true },
      { key: 'code', label: 'کد نقش', sortable: true },
      { key: 'type', label: 'نوع', sortable: true },
      { key: 'description', label: 'توضیحات', sortable: false },
      { key: 'users_count', label: 'تعداد کاربران', sortable: true },
      { key: 'actions', label: 'عملیات', sortable: false },
    ]

    const permissions = [
      { id: 1, name: 'مدیریت کاربران', desc: 'ایجاد، ویرایش و حذف کاربران' },
      { id: 2, name: 'مدیریت واحدها', desc: 'ایجاد، ویرایش و حذف واحدها' },
      { id: 3, name: 'مدیریت اهداف', desc: 'ایجاد، ویرایش و حذف اهداف' },
      { id: 4, name: 'مدیریت برنامه‌ها', desc: 'ایجاد، ویرایش و حذف برنامه‌ها' },
      { id: 5, name: 'مدیریت اقدامات', desc: 'ایجاد، ویرایش و حذف اقدامات' },
      { id: 6, name: 'مدیریت فعالیت‌ها', desc: 'ایجاد، ویرایش و حذف فعالیت‌ها' },
      { id: 7, name: 'گزارش‌گیری', desc: 'دسترسی به گزارش‌های مختلف' },
      { id: 8, name: 'خروجی Excel', desc: 'دریافت خروجی Excel' },
    ]

    const typeOpts = ['مدیریتی', 'کاربری', 'نظارتی', 'اجرایی']
    const emptyForm = () => ({ name: '', code: '', type: '', description: '' })
    const form = ref(emptyForm())

    // ============================================================
    // دریافت لیست نقش‌ها از API با صفحه‌بندی
    // ============================================================
    const fetchRoles = async () => {
      loading.value = true
      try {
        let url = `/roles?page=${pagination.value.current_page}&per_page=${pagination.value.per_page}`

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
            message: response.data.message || 'خطا در دریافت نقش‌ها',
            position: 'top'
          })
        }
      } catch (error) {
        console.error('Fetch roles error:', error)
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
      fetchRoles()
    }

    // ============================================================
    // رفتن به صفحه مشخص
    // ============================================================
    const goToPage = (page) => {
      pagination.value.current_page = page
      fetchRoles()
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
          type: row.type,
          description: row.description || ''
        }
      } else {
        form.value = emptyForm()
      }
      dialog.value = true
    }

    // ============================================================
    // باز کردن دیالوگ دسترسی‌ها
    // ============================================================
    const openPerms = (row) => {
      selectedRole.value = row
      permissions.forEach(p => {
        selectedPerms.value[p.id] = false
      })
      permsDialog.value = true
    }

    // ============================================================
    // ذخیره نقش (ایجاد یا ویرایش)
    // ============================================================
    const save = async () => {
      if (!form.value.name || !form.value.code) {
        $q.notify({
          type: 'negative',
          message: 'نام و کد نقش الزامی هستند',
          position: 'top'
        })
        return
      }

      saving.value = true

      try {
        if (editing.value) {
          // ویرایش نقش
          const response = await api.put(`/roles/${editing.value.id}`, {
            name: form.value.name,
            code: form.value.code,
            type: form.value.type,
            description: form.value.description,
            is_active: true
          })

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'نقش با موفقیت ویرایش شد',
              position: 'top'
            })
            await fetchRoles()
            dialog.value = false
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در ویرایش نقش',
              position: 'top'
            })
          }
        } else {
          // ایجاد نقش جدید
          const response = await api.post('/roles', {
            name: form.value.name,
            code: form.value.code,
            type: form.value.type,
            description: form.value.description,
            is_active: true
          })

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'نقش جدید با موفقیت ایجاد شد',
              position: 'top'
            })
            await fetchRoles()
            dialog.value = false
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در ایجاد نقش',
              position: 'top'
            })
          }
        }
      } catch (error) {
        console.error('Save role error:', error)

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
    // ذخیره دسترسی‌ها
    // ============================================================
    const savePerms = async () => {
      savingPerms.value = true

      setTimeout(() => {
        $q.notify({
          type: 'positive',
          message: 'دسترسی‌ها با موفقیت ذخیره شد',
          position: 'top'
        })
        savingPerms.value = false
        permsDialog.value = false
      }, 500)
    }

    // ============================================================
    // حذف نقش
    // ============================================================
    const deleteRow = (row) => {
      if (row.code === 'ADMIN') {
        $q.notify({
          type: 'warning',
          message: 'نقش مدیر سیستم قابل حذف نیست',
          position: 'top'
        })
        return
      }

      $q.dialog({
        title: 'حذف نقش',
        message: `آیا از حذف "${row.name}" مطمئنید؟`,
        cancel: { label: 'انصراف', flat: true },
        ok: { label: 'حذف', color: 'negative', unelevated: true },
        persistent: true
      }).onOk(async () => {
        try {
          const response = await api.delete(`/roles/${row.id}`)

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'نقش با موفقیت حذف شد',
              position: 'top'
            })
            await fetchRoles()
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در حذف نقش',
              position: 'top'
            })
          }
        } catch (error) {
          console.error('Delete role error:', error)
          $q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'خطا در حذف نقش',
            position: 'top'
          })
        }
      })
    }

    // ============================================================
    // بارگذاری اولیه
    // ============================================================
    onMounted(() => {
      fetchRoles()
    })

    return {
      search,
      dialog,
      permsDialog,
      editing,
      selectedRole,
      selectedPerms,
      loading,
      saving,
      savingPerms,
      rows,
      form,
      permissions,
      typeOpts,
      columns,
      pagination,
      openDialog,
      openPerms,
      save,
      savePerms,
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

.user-count { font-size: 12px; color: #64748b; display: flex; align-items: center; }
.perms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.perm-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; border-radius: 10px;
  background: #f8fafc; border: 1px solid #f1f5f9;
}
.perm-info { display: flex; flex-direction: column; gap: 2px; }
.perm-name { font-size: 13px; font-weight: 600; color: #1e293b; }
.perm-desc { font-size: 11.5px; color: #94a3b8; }
</style>
