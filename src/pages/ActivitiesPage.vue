<!-- src/pages/ActivitiesPage.vue -->
<template>
  <div class="page-root">

    <PageHeader title="مدیریت فعالیت‌ها" subtitle="تعریف و مدیریت فعالیت‌های اقدامات" icon="article">
      <q-btn unelevated color="primary" icon="add" label="فعالیت جدید" @click="openDialog()" />
    </PageHeader>

    <div class="filter-bar">
      <q-input
        v-model="search"
        outlined
        dense
        placeholder="جستجو در عنوان فعالیت..."
        clearable
        style="max-width:320px"
        @update:model-value="handleSearch"
      >
        <template #prepend><q-icon name="search" size="18px" color="grey-5" /></template>
      </q-input>
      <span class="stat-chip">{{ pagination.total }} فعالیت</span>
    </div>

    <SortableTable :columns="columns" :rows="rows" empty-icon="article" empty-text="فعالیتی یافت نشد" default-sort="title" :loading="loading">
      <template #default="{ row, index }">
        <td class="text-center">{{ (pagination.current_page - 1) * pagination.per_page + index + 1 }}</td>
        <td><span class="row-name">{{ row.title }}</span></td>
        <td>
          <div class="task-ref">
            <code class="code-chip code-sm">{{ row.task?.code || '—' }}</code>
            <span class="task-title">{{ row.task?.title || '—' }}</span>
          </div>
        </td>
        <td>{{ row.indicator || '—' }}</td>
        <td>{{ row.measure || '—' }}</td>
        <td>{{ row.responsible || '—' }}</td>
        <td>{{ row.collaborator || '—' }}</td>
        <td>
          <div class="prog-wrap">
            <div class="prog-track"><div class="prog-fill" :style="{ width: (row.progress || 0) + '%' }"></div></div>
            <span class="prog-text">{{ row.progress || 0 }}%</span>
          </div>
        </td>
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
        {{ pagination.total }} فعالیت
      </span>
    </div>

    <!-- دیالوگ ایجاد/ویرایش -->
    <q-dialog v-model="dialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>{{ editing ? 'ویرایش فعالیت' : 'فعالیت جدید' }}</h3>
          <button class="dialog-close" @click="dialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">
          <div class="form-group full-width">
            <label>اقدام مرتبط <span class="req">*</span></label>
            <q-select
              v-model="form.task_id"
              outlined
              dense
              :options="taskOpts"
              emit-value
              map-options
            />
          </div>
          <div class="form-group full-width">
            <label>عنوان فعالیت <span class="req">*</span></label>
            <q-input v-model="form.title" outlined dense hide-bottom-space />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>شاخص</label>
              <q-input v-model="form.indicator" outlined dense />
            </div>
            <div class="form-group">
              <label>سنجه</label>
              <q-input v-model="form.measure" outlined dense />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>مجری</label>
              <q-input v-model="form.responsible" outlined dense />
            </div>
            <div class="form-group">
              <label>همکار</label>
              <q-input v-model="form.collaborator" outlined dense />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>درصد پیشرفت</label>
              <q-input
                v-model="form.progress"
                outlined
                dense
                type="number"
                min="0"
                max="100"
                step="5"
              />
            </div>
          </div>
          <div class="form-group full-width">
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
    const taskOpts = ref([])

    // Pagination state
    const pagination = ref({
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0
    })

    const columns = [
      { key: 'index', label: '#', sortable: false },
      { key: 'title', label: 'عنوان فعالیت', sortable: true },
      { key: 'task', label: 'اقدام مرتبط', sortable: true },
      { key: 'indicator', label: 'شاخص', sortable: true },
      { key: 'measure', label: 'سنجه', sortable: true },
      { key: 'responsible', label: 'مجری', sortable: true },
      { key: 'collaborator', label: 'همکار', sortable: true },
      { key: 'progress', label: 'پیشرفت', sortable: true },
      { key: 'actions', label: 'عملیات', sortable: false },
    ]

    const emptyForm = () => ({
      title: '',
      task_id: null,
      indicator: '',
      measure: '',
      responsible: '',
      collaborator: '',
      progress: 0,
      description: ''
    })
    const form = ref(emptyForm())

    // ============================================================
    // دریافت لیست اقدامات از API
    // ============================================================
    const fetchTasks = async () => {
      try {
        const response = await api.get('/tasks?per_page=100')
        if (response.data.success) {
          taskOpts.value = response.data.data.map(task => ({
            label: `${task.code}: ${task.title}`,
            value: task.id
          }))
        }
      } catch (error) {
        console.error('Fetch tasks error:', error)
      }
    }

    // ============================================================
    // دریافت لیست فعالیت‌ها از API با صفحه‌بندی
    // ============================================================
    const fetchActivities = async () => {
      loading.value = true
      try {
        let url = `/activities?page=${pagination.value.current_page}&per_page=${pagination.value.per_page}`

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
            message: response.data.message || 'خطا در دریافت فعالیت‌ها',
            position: 'top'
          })
        }
      } catch (error) {
        console.error('Fetch activities error:', error)
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
      fetchActivities()
    }

    // ============================================================
    // رفتن به صفحه مشخص
    // ============================================================
    const goToPage = (page) => {
      pagination.value.current_page = page
      fetchActivities()
    }

    // ============================================================
    // باز کردن دیالوگ (ایجاد یا ویرایش)
    // ============================================================
    const openDialog = (row = null) => {
      editing.value = row
      if (row) {
        form.value = {
          title: row.title,
          task_id: row.task_id,
          indicator: row.indicator || '',
          measure: row.measure || '',
          responsible: row.responsible || '',
          collaborator: row.collaborator || '',
          progress: row.progress || 0,
          description: row.description || ''
        }
      } else {
        form.value = emptyForm()
      }
      dialog.value = true
    }

    // ============================================================
    // ذخیره فعالیت (ایجاد یا ویرایش)
    // ============================================================
    const save = async () => {
      if (!form.value.title || !form.value.task_id) {
        $q.notify({
          type: 'negative',
          message: 'عنوان فعالیت و اقدام مرتبط الزامی هستند',
          position: 'top'
        })
        return
      }

      // تبدیل progress به عدد
      const progressValue = parseInt(form.value.progress) || 0
      if (progressValue < 0) form.value.progress = 0
      if (progressValue > 100) form.value.progress = 100

      saving.value = true

      try {
        if (editing.value) {
          // ویرایش فعالیت
          const response = await api.put(`/activities/${editing.value.id}`, form.value)

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'فعالیت با موفقیت ویرایش شد',
              position: 'top'
            })
            await fetchActivities()
            dialog.value = false
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در ویرایش فعالیت',
              position: 'top'
            })
          }
        } else {
          // ایجاد فعالیت جدید
          const response = await api.post('/activities', form.value)

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'فعالیت جدید با موفقیت ایجاد شد',
              position: 'top'
            })
            await fetchActivities()
            dialog.value = false
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در ایجاد فعالیت',
              position: 'top'
            })
          }
        }
      } catch (error) {
        console.error('Save activity error:', error)

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
    // حذف فعالیت
    // ============================================================
    const deleteRow = (row) => {
      $q.dialog({
        title: 'حذف فعالیت',
        message: `آیا از حذف "${row.title}" مطمئنید؟`,
        cancel: { label: 'انصراف', flat: true },
        ok: { label: 'حذف', color: 'negative', unelevated: true },
        persistent: true
      }).onOk(async () => {
        try {
          const response = await api.delete(`/activities/${row.id}`)

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'فعالیت با موفقیت حذف شد',
              position: 'top'
            })
            await fetchActivities()
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در حذف فعالیت',
              position: 'top'
            })
          }
        } catch (error) {
          console.error('Delete activity error:', error)
          $q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'خطا در حذف فعالیت',
            position: 'top'
          })
        }
      })
    }

    // ============================================================
    // بارگذاری اولیه
    // ============================================================
    onMounted(() => {
      fetchTasks()
      fetchActivities()
    })

    return {
      search,
      dialog,
      editing,
      loading,
      saving,
      rows,
      form,
      taskOpts,
      columns,
      pagination,
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

.task-ref {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.code-sm { font-size: 10.5px; padding: 1px 6px; }
.task-title { font-size: 12px; color: #64748b; }

.form-group.full-width {
  grid-column: 1 / -1;
  width: 100%;
}
</style>
