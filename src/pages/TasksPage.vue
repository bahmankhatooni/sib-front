<!-- src/pages/TasksPage.vue -->
<template>
  <div class="page-root">

    <PageHeader title="مدیریت اقدامات" subtitle="تعریف و مدیریت اقدامات برنامه‌های عملیاتی" icon="checklist_rtl">
      <q-btn unelevated color="primary" icon="add" label="اقدام جدید" @click="openDialog()" />
    </PageHeader>

    <div class="filter-bar">
      <q-input
        v-model="search"
        outlined
        dense
        placeholder="جستجو در عنوان یا کد اقدام..."
        clearable
        style="max-width:320px"
        @update:model-value="handleSearch"
      >
        <template #prepend><q-icon name="search" size="18px" color="grey-5" /></template>
      </q-input>
      <q-select
        v-model="targetFilter"
        outlined
        dense
        :options="targetOpts"
        label="هدف"
        clearable
        style="min-width:200px"
        @update:model-value="handleTargetFilter"
      />
      <q-select
        v-model="programFilter"
        outlined
        dense
        :options="filteredProgramOptsForFilter"
        label="برنامه"
        clearable
        style="min-width:200px"
        :disable="!targetFilter"
        @update:model-value="handleProgramFilter"
      />
      <span class="stat-chip">{{ pagination.total }} اقدام</span>
    </div>

    <SortableTable :columns="columns" :rows="rows" empty-icon="checklist_rtl" empty-text="اقدامی یافت نشد" default-sort="title" :loading="loading">
      <template #default="{ row, index }">
        <td class="text-center">{{ (pagination.current_page - 1) * pagination.per_page + index + 1 }}</td>
        <td><code class="code-chip">{{ row.code }}</code></td>
        <td><span class="row-name">{{ row.title }}</span></td>
        <td>
          <div class="target-ref">
            <code class="code-chip code-sm">{{ row.target?.code || '—' }}</code>
            <span class="target-title">{{ row.target?.title || '—' }}</span>
          </div>
        </td>
        <td>
          <div class="program-ref">
            <code class="code-chip code-sm">{{ row.program?.code || '—' }}</code>
            <span class="program-title">{{ row.program?.title || '—' }}</span>
          </div>
        </td>
        <td><span class="count-badge"><q-icon name="article" size="13px" class="q-ml-xs" />{{ row.activities_count || 0 }}</span></td>
        <td>
          <div class="action-btns">
            <button class="act-btn act-view"   @click="viewActivities(row)" title="فعالیت‌ها"><q-icon name="list" size="16px" /></button>
            <button class="act-btn act-edit"   @click="openDialog(row)"     title="ویرایش"><q-icon name="edit" size="16px" /></button>
            <button class="act-btn act-delete" @click="deleteRow(row)"      title="حذف"><q-icon name="delete_outline" size="16px" /></button>
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
        {{ pagination.total }} اقدام
      </span>
    </div>

    <!-- دیالوگ ایجاد/ویرایش -->
    <q-dialog v-model="dialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>{{ editing ? 'ویرایش اقدام' : 'اقدام جدید' }}</h3>
          <button class="dialog-close" @click="dialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">

          <!-- فیلد هدف مرتبط (عرض کامل) -->
          <div class="form-group full-width">
            <label>هدف مرتبط <span class="req">*</span></label>
            <q-select
              v-model="form.target_id"
              outlined
              dense
              :options="targetOpts"
              emit-value
              map-options
              @update:model-value="onTargetChange"
            />
          </div>

          <!-- فیلد برنامه مرتبط (عرض کامل) -->
          <div class="form-group full-width">
            <label>برنامه مرتبط <span class="req">*</span></label>
            <q-select
              v-model="form.program_id"
              outlined
              dense
              :options="filteredProgramOpts"
              emit-value
              map-options
              :disable="!form.target_id"
            />
          </div>

          <!-- فیلد کد اقدام (عرض کامل) -->
          <div class="form-group full-width">
            <label>کد اقدام <span class="req">*</span></label>
            <q-input v-model="form.code" outlined dense hide-bottom-space />
          </div>

          <!-- فیلد عنوان اقدام (عرض کامل) -->
          <div class="form-group full-width">
            <label>عنوان اقدام <span class="req">*</span></label>
            <q-input v-model="form.title" outlined dense hide-bottom-space />
          </div>

        </div>
        <div class="dialog-foot">
          <q-btn flat label="انصراف" @click="dialog=false" />
          <q-btn unelevated color="primary" :label="editing ? 'ذخیره' : 'ایجاد'" @click="save" :loading="saving" />
        </div>
      </div>
    </q-dialog>

    <!-- دیالوگ فعالیت‌ها -->
    <q-dialog v-model="activitiesDialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>فعالیت‌های اقدام: {{ selectedTask?.title }}</h3>
          <button class="dialog-close" @click="activitiesDialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">
          <div class="sub-list" v-if="taskActivities.length > 0">
            <div class="sub-item" v-for="a in taskActivities" :key="a.id">
              <div class="sub-icon" :class="a.is_completed ? 'sub-icon--green' : 'sub-icon--grey'">
                <q-icon :name="a.is_completed ? 'check' : 'hourglass_empty'" size="16px" />
              </div>
              <div class="sub-info">
                <span class="sub-name">{{ a.title }}</span>
                <span class="sub-meta">کد: {{ a.code }}</span>
              </div>
              <span class="status-badge" :class="a.is_completed ? 'badge-active' : 'badge-pending'">
                {{ a.is_completed ? 'انجام شده' : 'انجام نشده' }}
              </span>
            </div>
          </div>
          <div v-else class="empty-activities">
            <q-icon name="info" size="32px" color="grey-4" />
            <p>فعالیتی برای این اقدام تعریف نشده است</p>
          </div>
        </div>
        <div class="dialog-foot">
          <q-btn flat label="بستن" @click="activitiesDialog=false" />
        </div>
      </div>
    </q-dialog>

  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import PageHeader from 'components/PageHeader.vue'
import SortableTable from 'components/SortableTable.vue'

export default {
  components: { PageHeader, SortableTable },
  setup () {
    const $q = useQuasar()
    const search = ref('')
    const targetFilter = ref(null)
    const programFilter = ref(null)
    const dialog = ref(false)
    const activitiesDialog = ref(false)
    const editing = ref(null)
    const selectedTask = ref(null)
    const loading = ref(false)
    const saving = ref(false)
    const rows = ref([])
    const targetOpts = ref([])
    const allPrograms = ref([])
    const taskActivities = ref([])

    // Pagination state
    const pagination = ref({
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0
    })

    // ستون‌های جدول
    const columns = [
      { key: 'index', label: '#', sortable: false },
      { key: 'code', label: 'کد', sortable: true },
      { key: 'title', label: 'عنوان اقدام', sortable: true },
      { key: 'target', label: 'هدف', sortable: true },
      { key: 'program', label: 'برنامه', sortable: true },
      { key: 'activities_count', label: 'تعداد فعالیت‌ها', sortable: true },
      { key: 'actions', label: 'عملیات', sortable: false },
    ]

    // برنامه‌های فیلتر شده بر اساس هدف انتخاب شده (برای فیلترهای بالا)
    const filteredProgramOptsForFilter = computed(() => {
      if (targetFilter.value) {
        return allPrograms.value
          .filter(p => p.target_id === targetFilter.value.value)
          .map(p => ({
            label: `${p.code}: ${p.title}`,
            value: p.id
          }))
      }
      return []
    })

    // برنامه‌های فیلتر شده بر اساس هدف انتخاب شده (برای دیالوگ)
    const filteredProgramOpts = computed(() => {
      if (form.value.target_id) {
        return allPrograms.value
          .filter(p => p.target_id === form.value.target_id)
          .map(p => ({
            label: `${p.code}: ${p.title}`,
            value: p.id
          }))
      }
      return []
    })

    const emptyForm = () => ({
      code: '',
      title: '',
      target_id: null,
      program_id: null,
      activity: '',
      is_active: true
    })
    const form = ref(emptyForm())

    // ============================================================
    // دریافت لیست اهداف از API
    // ============================================================
    const fetchTargets = async () => {
      try {
        const response = await api.get('/targets?per_page=100')
        if (response.data.success) {
          targetOpts.value = response.data.data.map(target => ({
            label: `${target.code}: ${target.title}`,
            value: target.id
          }))
        }
      } catch (error) {
        console.error('Fetch targets error:', error)
      }
    }

    // ============================================================
    // دریافت لیست برنامه‌ها از API
    // ============================================================
    const fetchPrograms = async () => {
      try {
        const response = await api.get('/programs?per_page=100')
        if (response.data.success) {
          allPrograms.value = response.data.data
        }
      } catch (error) {
        console.error('Fetch programs error:', error)
      }
    }

    // ============================================================
    // دریافت لیست اقدامات از API با صفحه‌بندی
    // ============================================================
    const fetchTasks = async () => {
      loading.value = true
      try {
        let url = `/tasks?page=${pagination.value.current_page}&per_page=${pagination.value.per_page}`

        if (search.value) {
          url += `&search=${encodeURIComponent(search.value)}`
        }
        if (targetFilter.value) {
          url += `&target_id=${targetFilter.value.value}`
        }
        if (programFilter.value) {
          url += `&program_id=${programFilter.value.value}`
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
            message: response.data.message || 'خطا در دریافت اقدامات',
            position: 'top'
          })
        }
      } catch (error) {
        console.error('Fetch tasks error:', error)
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
    // دریافت فعالیت‌های یک اقدام
    // ============================================================
    const fetchTaskActivities = async (taskId) => {
      try {
        const response = await api.get(`/tasks/${taskId}`)
        if (response.data.success) {
          taskActivities.value = response.data.data.activities || []
        }
      } catch (error) {
        console.error('Fetch task activities error:', error)
        taskActivities.value = []
      }
    }

    // ============================================================
    // جستجو
    // ============================================================
    const handleSearch = () => {
      pagination.value.current_page = 1
      fetchTasks()
    }

    // ============================================================
    // فیلتر بر اساس هدف
    // ============================================================
    const handleTargetFilter = () => {
      pagination.value.current_page = 1
      programFilter.value = null
      fetchTasks()
    }

    // ============================================================
    // فیلتر بر اساس برنامه
    // ============================================================
    const handleProgramFilter = () => {
      pagination.value.current_page = 1
      fetchTasks()
    }

    // ============================================================
    // رفتن به صفحه مشخص
    // ============================================================
    const goToPage = (page) => {
      pagination.value.current_page = page
      fetchTasks()
    }

    // ============================================================
    // تغییر هدف در دیالوگ
    // ============================================================
    const onTargetChange = () => {
      form.value.program_id = null
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
          target_id: row.target_id,
          program_id: row.program_id,
          activity: row.activity || '',
          is_active: row.is_active ?? true
        }
      } else {
        form.value = emptyForm()
      }
      dialog.value = true
    }

    // ============================================================
    // مشاهده فعالیت‌های اقدام
    // ============================================================
    const viewActivities = async (row) => {
      selectedTask.value = row
      await fetchTaskActivities(row.id)
      activitiesDialog.value = true
    }

    // ============================================================
    // ذخیره اقدام (ایجاد یا ویرایش)
    // ============================================================
    const save = async () => {
      if (!form.value.code || !form.value.title || !form.value.target_id || !form.value.program_id) {
        $q.notify({
          type: 'negative',
          message: 'کد، عنوان، هدف و برنامه الزامی هستند',
          position: 'top'
        })
        return
      }

      saving.value = true

      try {
        if (editing.value) {
          // ویرایش اقدام
          const response = await api.put(`/tasks/${editing.value.id}`, form.value)

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'اقدام با موفقیت ویرایش شد',
              position: 'top'
            })
            await fetchTasks()
            dialog.value = false
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در ویرایش اقدام',
              position: 'top'
            })
          }
        } else {
          // ایجاد اقدام جدید
          const response = await api.post('/tasks', form.value)

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'اقدام جدید با موفقیت ایجاد شد',
              position: 'top'
            })
            await fetchTasks()
            dialog.value = false
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در ایجاد اقدام',
              position: 'top'
            })
          }
        }
      } catch (error) {
        console.error('Save task error:', error)

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
    // حذف اقدام
    // ============================================================
    const deleteRow = (row) => {
      $q.dialog({
        title: 'حذف اقدام',
        message: `آیا از حذف "${row.title}" مطمئنید؟`,
        cancel: { label: 'انصراف', flat: true },
        ok: { label: 'حذف', color: 'negative', unelevated: true },
        persistent: true
      }).onOk(async () => {
        try {
          const response = await api.delete(`/tasks/${row.id}`)

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'اقدام با موفقیت حذف شد',
              position: 'top'
            })
            await fetchTasks()
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در حذف اقدام',
              position: 'top'
            })
          }
        } catch (error) {
          console.error('Delete task error:', error)
          $q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'خطا در حذف اقدام',
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
      fetchPrograms()
      fetchTasks()
    })

    return {
      search,
      targetFilter,
      programFilter,
      dialog,
      activitiesDialog,
      editing,
      selectedTask,
      loading,
      saving,
      rows,
      form,
      targetOpts,
      filteredProgramOpts,
      filteredProgramOptsForFilter,
      taskActivities,
      columns,
      pagination,
      openDialog,
      viewActivities,
      save,
      deleteRow,
      goToPage,
      handleSearch,
      handleTargetFilter,
      handleProgramFilter,
      onTargetChange
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

.target-ref, .program-ref {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.code-sm { font-size: 10.5px; padding: 1px 6px; }
.target-title, .program-title { font-size: 12px; color: #64748b; }
.count-badge { font-size: 12px; color: #64748b; display: flex; align-items: center; }
.sub-list { display: flex; flex-direction: column; gap: 8px; }
.sub-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: 10px;
  background: #f8fafc; border: 1px solid #f1f5f9;
}
.sub-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sub-icon--green { background: #ecfdf5; color: #16a34a; }
.sub-icon--grey  { background: #f1f5f9; color: #94a3b8; }
.sub-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.sub-name { font-size: 13px; font-weight: 600; color: #1e293b; }
.sub-meta { font-size: 11.5px; color: #94a3b8; }
.empty-activities {
  text-align: center;
  padding: 32px;
  color: #94a3b8;
  p { margin-top: 8px; font-size: 13px; }
}

// کلاس برای عرض کامل در دیالوگ
.form-group.full-width {
  grid-column: 1 / -1;
  width: 100%;
}
</style>
