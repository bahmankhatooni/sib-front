<!-- src/pages/UsersPage.vue -->
<template>
  <div class="page-root">

    <PageHeader title="مدیریت کاربران" subtitle="ایجاد، ویرایش و مدیریت کاربران سامانه" icon="group">
      <q-btn unelevated color="primary" icon="add" label="کاربر جدید" @click="openDialog()" />
    </PageHeader>

    <div class="filter-bar">
      <q-input
        v-model="search"
        outlined
        dense
        placeholder="جستجو در نام یا نام کاربری..."
        clearable
        style="max-width:320px"
        @update:model-value="handleSearch"
      >
        <template #prepend><q-icon name="search" size="18px" color="grey-5" /></template>
      </q-input>
      <q-select
        v-model="roleFilter"
        outlined
        dense
        :options="roleOpts"
        label="نقش"
        clearable
        style="min-width:160px"
        @update:model-value="handleRoleFilter"
      />
      <span class="stat-chip">{{ pagination.total }} کاربر</span>
    </div>

    <SortableTable :columns="columns" :rows="rows" empty-icon="group" empty-text="کاربری یافت نشد" default-sort="firstName" :loading="loading">
      <template #default="{ row, index }">
        <td class="text-center">{{ (pagination.current_page - 1) * pagination.per_page + index + 1 }}</td>
        <td>
          <div>
            <div class="user-fullname">{{ row.first_name }} {{ row.last_name }}</div>
            <div class="user-phone">{{ row.phone || '—' }}</div>
          </div>
        </td>
        <td><code class="code-chip">{{ row.username }}</code></td>
        <td>{{ row.email || '—' }}</td>
        <td><span class="status-badge badge-info">{{ row.role?.name || '—' }}</span></td>
        <td>{{ row.unit?.name || '—' }}</td>
        <td>
          <span class="status-badge" :class="row.is_active ? 'badge-active' : 'badge-inactive'">
            {{ row.is_active ? 'فعال' : 'غیرفعال' }}
          </span>
        </td>
        <td>
          <div class="action-btns">
            <button class="act-btn act-edit"   @click="openDialog(row)" title="ویرایش"><q-icon name="edit" size="16px" /></button>
            <button class="act-btn act-assign" @click="toggleStatus(row)" :title="row.is_active ? 'غیرفعال' : 'فعال'">
              <q-icon :name="row.is_active ? 'block' : 'check_circle'" size="16px" />
            </button>
            <button class="act-btn act-view"   @click="openPassDialog(row)" title="تغییر رمز"><q-icon name="key" size="16px" /></button>
            <button class="act-btn act-delete" @click="deleteRow(row)" title="حذف"><q-icon name="delete_outline" size="16px" /></button>
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
        {{ pagination.total }} کاربر
      </span>
    </div>

    <!-- دیالوگ ایجاد/ویرایش کاربر -->
    <q-dialog v-model="dialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>{{ editing ? 'ویرایش کاربر' : 'کاربر جدید' }}</h3>
          <button class="dialog-close" @click="dialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">
          <div class="form-row">
            <div class="form-group">
              <label>نام <span class="req">*</span></label>
              <q-input v-model="form.first_name" outlined dense hide-bottom-space />
            </div>
            <div class="form-group">
              <label>نام خانوادگی <span class="req">*</span></label>
              <q-input v-model="form.last_name" outlined dense hide-bottom-space />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>نام کاربری <span class="req">*</span></label>
              <q-input v-model="form.username" outlined dense hide-bottom-space />
            </div>
            <div class="form-group">
              <label>شماره تماس</label>
              <q-input v-model="form.phone" outlined dense hide-bottom-space />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>ایمیل</label>
              <q-input v-model="form.email" outlined dense type="email" hide-bottom-space />
            </div>
            <div class="form-group">
              <label>نقش <span class="req">*</span></label>
              <q-select v-model="form.role_id" outlined dense :options="roleOpts" emit-value map-options />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>واحد</label>
              <q-select v-model="form.unit_id" outlined dense :options="unitOpts" emit-value map-options clearable />
            </div>
            <div class="form-group" v-if="!editing">
              <label>رمز عبور <span class="req">*</span></label>
              <q-input v-model="form.password" outlined dense type="password" hide-bottom-space />
            </div>
            <div class="form-group" v-else>
              <label>رمز عبور جدید (اختیاری)</label>
              <q-input v-model="form.password" outlined dense type="password" placeholder="برای تغییر رمز عبور وارد کنید" hide-bottom-space />
            </div>
          </div>
          <div class="form-group">
            <q-toggle v-model="form.is_active" label="کاربر فعال است" color="primary" />
          </div>
        </div>
        <div class="dialog-foot">
          <q-btn flat label="انصراف" @click="dialog=false" />
          <q-btn unelevated color="primary" :label="editing ? 'ذخیره' : 'ایجاد'" @click="save" :loading="saving" />
        </div>
      </div>
    </q-dialog>

    <!-- دیالوگ تغییر رمز عبور -->
    <q-dialog v-model="passDialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>تغییر رمز عبور</h3>
          <button class="dialog-close" @click="passDialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>رمز عبور جدید <span class="req">*</span></label>
            <q-input v-model="newPass" outlined dense type="password" hide-bottom-space />
          </div>
          <div class="form-group">
            <label>تکرار رمز عبور <span class="req">*</span></label>
            <q-input v-model="confirmPass" outlined dense type="password" hide-bottom-space />
          </div>
        </div>
        <div class="dialog-foot">
          <q-btn flat label="انصراف" @click="passDialog=false" />
          <q-btn unelevated color="primary" label="تغییر رمز" @click="savePass" :loading="savingPass" />
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
    const roleFilter = ref(null)
    const dialog = ref(false)
    const passDialog = ref(false)
    const editing = ref(null)
    const newPass = ref('')
    const confirmPass = ref('')
    const loading = ref(false)
    const saving = ref(false)
    const savingPass = ref(false)
    const rows = ref([])
    const roleOpts = ref([])
    const unitOpts = ref([])

    // Pagination state
    const pagination = ref({
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0
    })

    const columns = [
      { key: 'index', label: '#', sortable: false },
      { key: 'fullName', label: 'نام و نام خانوادگی', sortable: true },
      { key: 'username', label: 'نام کاربری', sortable: true },
      { key: 'email', label: 'ایمیل', sortable: true },
      { key: 'role', label: 'نقش', sortable: true },
      { key: 'unit', label: 'واحد', sortable: true },
      { key: 'status', label: 'وضعیت', sortable: true },
      { key: 'actions', label: 'عملیات', sortable: false },
    ]

    const emptyForm = () => ({
      first_name: '', last_name: '', username: '', email: '', phone: '',
      role_id: null, unit_id: null, password: '', is_active: true
    })
    const form = ref(emptyForm())

    // ============================================================
    // دریافت لیست نقش‌ها از API
    // ============================================================
    const fetchRoles = async () => {
      try {
        const response = await api.get('/roles?per_page=100')
        if (response.data.success) {
          roleOpts.value = response.data.data.map(role => ({
            label: role.name,
            value: role.id
          }))
        }
      } catch (error) {
        console.error('Fetch roles error:', error)
      }
    }

    // ============================================================
    // دریافت لیست واحدها از API
    // ============================================================
    const fetchUnits = async () => {
      try {
        const response = await api.get('/units?per_page=100')
        if (response.data.success) {
          unitOpts.value = response.data.data.map(unit => ({
            label: unit.name,
            value: unit.id
          }))
        }
      } catch (error) {
        console.error('Fetch units error:', error)
      }
    }

    // ============================================================
    // دریافت لیست کاربران از API با صفحه‌بندی
    // ============================================================
    const fetchUsers = async () => {
      loading.value = true
      try {
        let url = `/users?page=${pagination.value.current_page}&per_page=${pagination.value.per_page}`

        if (search.value) {
          url += `&search=${encodeURIComponent(search.value)}`
        }
        if (roleFilter.value) {
          url += `&role_id=${roleFilter.value.value}`
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
            message: response.data.message || 'خطا در دریافت کاربران',
            position: 'top'
          })
        }
      } catch (error) {
        console.error('Fetch users error:', error)
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
      fetchUsers()
    }

    // ============================================================
    // فیلتر بر اساس نقش
    // ============================================================
    const handleRoleFilter = () => {
      pagination.value.current_page = 1
      fetchUsers()
    }

    // ============================================================
    // رفتن به صفحه مشخص
    // ============================================================
    const goToPage = (page) => {
      pagination.value.current_page = page
      fetchUsers()
    }

    // ============================================================
    // باز کردن دیالوگ (ایجاد یا ویرایش)
    // ============================================================
    const openDialog = (row = null) => {
      editing.value = row
      if (row) {
        form.value = {
          first_name: row.first_name,
          last_name: row.last_name,
          username: row.username,
          email: row.email || '',
          phone: row.phone || '',
          role_id: row.role_id,
          unit_id: row.unit_id,
          password: '',
          is_active: row.is_active
        }
      } else {
        form.value = emptyForm()
      }
      dialog.value = true
    }

    // ============================================================
    // باز کردن دیالوگ تغییر رمز عبور
    // ============================================================
    const openPassDialog = (row) => {
      editing.value = row
      newPass.value = ''
      confirmPass.value = ''
      passDialog.value = true
    }

    // ============================================================
    // تغییر وضعیت فعال/غیرفعال کاربر
    // ============================================================
    const toggleStatus = async (row) => {
      try {
        const response = await api.patch(`/users/${row.id}/toggle-status`)
        if (response.data.success) {
          await fetchUsers()
          $q.notify({
            type: 'positive',
            message: response.data.message,
            position: 'top'
          })
        } else {
          $q.notify({
            type: 'negative',
            message: response.data.message || 'خطا در تغییر وضعیت',
            position: 'top'
          })
        }
      } catch (error) {
        console.error('Toggle status error:', error)
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'خطا در تغییر وضعیت',
          position: 'top'
        })
      }
    }

    // ============================================================
    // ذخیره کاربر (ایجاد یا ویرایش)
    // ============================================================
    const save = async () => {
      if (!form.value.first_name || !form.value.last_name || !form.value.username || !form.value.role_id) {
        $q.notify({
          type: 'negative',
          message: 'فیلدهای الزامی (نام، نام خانوادگی، نام کاربری، نقش) را پر کنید',
          position: 'top'
        })
        return
      }

      saving.value = true

      try {
        if (editing.value) {
          // ویرایش کاربر
          const updateData = {
            first_name: form.value.first_name,
            last_name: form.value.last_name,
            username: form.value.username,
            email: form.value.email || null,
            phone: form.value.phone || null,
            role_id: form.value.role_id,
            unit_id: form.value.unit_id || null,
            is_active: form.value.is_active
          }

          if (form.value.password && form.value.password.trim() !== '') {
            updateData.password = form.value.password
          }

          const response = await api.put(`/users/${editing.value.id}`, updateData)

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'کاربر با موفقیت ویرایش شد',
              position: 'top'
            })
            await fetchUsers()
            dialog.value = false
            form.value = emptyForm()
            editing.value = null
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در ویرایش کاربر',
              position: 'top'
            })
          }
        } else {
          // ایجاد کاربر جدید
          if (!form.value.password || form.value.password.trim() === '') {
            $q.notify({
              type: 'negative',
              message: 'رمز عبور الزامی است',
              position: 'top'
            })
            saving.value = false
            return
          }

          const response = await api.post('/users', {
            first_name: form.value.first_name,
            last_name: form.value.last_name,
            username: form.value.username,
            password: form.value.password,
            email: form.value.email || null,
            phone: form.value.phone || null,
            role_id: form.value.role_id,
            unit_id: form.value.unit_id || null,
            is_active: form.value.is_active
          })

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'کاربر جدید با موفقیت ایجاد شد',
              position: 'top'
            })
            await fetchUsers()
            dialog.value = false
            form.value = emptyForm()
            editing.value = null
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در ایجاد کاربر',
              position: 'top'
            })
          }
        }
      } catch (error) {
        console.error('Save user error:', error)

        if (error.response?.status === 422 && error.response?.data?.errors) {
          const errors = error.response.data.errors
          const firstError = Object.values(errors)[0]?.[0]
          $q.notify({
            type: 'negative',
            message: firstError || 'خطا در اعتبارسنجی اطلاعات',
            position: 'top',
            timeout: 5000
          })
        } else if (error.response?.status === 403) {
          $q.notify({
            type: 'negative',
            message: error.response.data?.message || 'شما دسترسی لازم برای این عملیات را ندارید',
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
    // ذخیره رمز عبور جدید
    // ============================================================
    const savePass = async () => {
      if (!newPass.value || newPass.value !== confirmPass.value) {
        $q.notify({
          type: 'negative',
          message: 'رمز عبور مطابقت ندارد',
          position: 'top'
        })
        return
      }

      if (newPass.value.length < 6) {
        $q.notify({
          type: 'negative',
          message: 'رمز عبور باید حداقل 6 کاراکتر باشد',
          position: 'top'
        })
        return
      }

      savingPass.value = true

      try {
        const response = await api.put(`/users/${editing.value.id}`, {
          password: newPass.value
        })

        if (response.data.success) {
          $q.notify({
            type: 'positive',
            message: 'رمز عبور با موفقیت تغییر کرد',
            position: 'top'
          })
          passDialog.value = false
          newPass.value = ''
          confirmPass.value = ''
          editing.value = null
        } else {
          $q.notify({
            type: 'negative',
            message: response.data.message || 'خطا در تغییر رمز عبور',
            position: 'top'
          })
        }
      } catch (error) {
        console.error('Save password error:', error)

        if (error.response?.status === 422 && error.response?.data?.errors) {
          const errors = error.response.data.errors
          const firstError = Object.values(errors)[0]?.[0]
          $q.notify({
            type: 'negative',
            message: firstError || 'خطا در اعتبارسنجی رمز عبور',
            position: 'top'
          })
        } else {
          $q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'خطا در تغییر رمز عبور',
            position: 'top'
          })
        }
      } finally {
        savingPass.value = false
      }
    }

    // ============================================================
    // حذف کاربر
    // ============================================================
    const deleteRow = (row) => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      if (currentUser.id === row.id) {
        $q.notify({
          type: 'warning',
          message: 'نمی‌توانید حساب کاربری خود را حذف کنید',
          position: 'top'
        })
        return
      }

      $q.dialog({
        title: 'حذف کاربر',
        message: `آیا از حذف "${row.first_name} ${row.last_name}" مطمئنید؟`,
        cancel: { label: 'انصراف', flat: true },
        ok: { label: 'حذف', color: 'negative', unelevated: true },
        persistent: true
      }).onOk(async () => {
        try {
          const response = await api.delete(`/users/${row.id}`)

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'کاربر با موفقیت حذف شد',
              position: 'top'
            })
            await fetchUsers()
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در حذف کاربر',
              position: 'top'
            })
          }
        } catch (error) {
          console.error('Delete user error:', error)
          $q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'خطا در حذف کاربر',
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
      fetchUnits()
      fetchUsers()
    })

    return {
      search,
      roleFilter,
      dialog,
      passDialog,
      editing,
      loading,
      saving,
      savingPass,
      rows,
      form,
      roleOpts,
      unitOpts,
      newPass,
      confirmPass,
      columns,
      pagination,
      openDialog,
      openPassDialog,
      toggleStatus,
      save,
      savePass,
      deleteRow,
      goToPage,
      handleSearch,
      handleRoleFilter
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

.user-fullname {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.user-phone {
  font-size: 11px;
  color: #94a3b8;
  direction: ltr;
  margin-top: 2px;
}
</style>
