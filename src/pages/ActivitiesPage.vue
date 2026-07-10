<!-- src/pages/ActivitiesPage.vue -->
<template>
  <div class="page-root">

    <PageHeader title="مدیریت فعالیت‌ها" subtitle="تعریف و مدیریت فعالیت‌های اقدامات" icon="article">
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
        <td><span class="row-name">{{ truncateText(row.title, 50) }}</span></td>
        <td>
          <div class="task-ref">
            <code class="code-chip code-sm">{{ truncateText(row.task?.code, 15) }}</code>
            <span class="task-title">{{ truncateText(row.task?.title, 30) }}</span>
          </div>
        </td>
        <td>{{ truncateText(row.indicator, 50) }}</td>
        <td>{{ truncateText(row.measure, 50) }}</td>
        <td>{{ truncateText(row.responsible, 50) }}</td>
        <td>{{ truncateText(row.collaborator, 50) }}</td>
        <td>
          <div class="prog-wrap">
            <div class="prog-track"><div class="prog-fill" :style="{ width: (row.progress || 0) + '%' }"></div></div>
            <span class="prog-text">{{ row.progress || 0 }}%</span>
          </div>
        </td>
        <td>
          <button 
            v-if="row.form_code"
            class="report-btn report-btn--form"
            @click="openForm(row.form_code)"
          >
            {{ row.form_code }}
          </button>
          <button 
            v-else-if="row.report"
            class="report-btn report-btn--done"
            @click="viewReport(row)"
          >
            اقدام شده
          </button>
          <button 
            v-else
            class="report-btn report-btn--new"
            @click="openReportDialog(row)"
          >
            ثبت گزارش
          </button>
        </td>
        <td>
          <div class="action-btns">
            <button 
              class="act-btn act-view"   
              @click="viewReport(row)" 
              title="نمایش گزارش"
            >
              <q-icon name="visibility" size="16px" />
            </button>
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

    <!-- دیالوگ ثبت گزارش -->
    <q-dialog v-model="reportDialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>ثبت گزارش عملکرد</h3>
          <button class="dialog-close" @click="reportDialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">
          <div class="form-group full-width">
            <label>گزارش عملکرد <span class="req">*</span></label>
            <q-input 
              v-model="reportText" 
              outlined 
              type="textarea" 
              rows="5"
              placeholder="گزارش عملکرد فعالیت را وارد کنید..."
            />
          </div>
        </div>
        <div class="dialog-foot">
          <q-btn flat label="انصراف" @click="reportDialog=false" />
          <q-btn unelevated color="primary" label="ذخیره گزارش" @click="saveReport" :loading="saving" />
        </div>
      </div>
    </q-dialog>

    <!-- دیالوگ نمایش گزارش -->
    <q-dialog v-model="viewReportDialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>نمایش گزارش عملکرد</h3>
          <button class="dialog-close" @click="viewReportDialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">
          <div class="report-view-box">
            <p>{{ viewingReport }}</p>
          </div>
        </div>
        <div class="dialog-foot">
          <q-btn unelevated color="primary" label="بستن" @click="viewReportDialog=false" />
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
    const reportDialog = ref(false)
    const viewReportDialog = ref(false)
    const editing = ref(null)
    const loading = ref(false)
    const saving = ref(false)
    const rows = ref([])
    const taskOpts = ref([])
    const reportText = ref('')
    const reportingActivity = ref(null)
    const viewingReport = ref('')

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
      { key: 'report', label: 'گزارش عملکرد / کاربرگ', sortable: false },
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
    // تابع برش متن برای نمایش محدود
    // ============================================================
    const truncateText = (text, maxLength = 50) => {
      if (!text) return '—'
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }

    // ============================================================
    // بارگذاری اولیه
    // ============================================================
    onMounted(() => {
      fetchTasks()
      fetchActivities()
    })

    // ============================================================
    // باز کردن دیالوگ ثبت گزارش
    // ============================================================
    const openReportDialog = (row) => {
      reportingActivity.value = row
      reportText.value = row.report || ''
      reportDialog.value = true
    }

    // ============================================================
    // ذخیره گزارش
    // ============================================================
    const saveReport = async () => {
      if (!reportText.value || !reportText.value.trim()) {
        $q.notify({
          type: 'negative',
          message: 'لطفاً متن گزارش را وارد کنید',
          position: 'top'
        })
        return
      }

      saving.value = true
      try {
        const response = await api.put(`/activities/${reportingActivity.value.id}`, {
          ...reportingActivity.value,
          report: reportText.value
        })

        if (response.data.success) {
          $q.notify({
            type: 'positive',
            message: 'گزارش با موفقیت ثبت شد',
            position: 'top'
          })
          reportDialog.value = false
          await fetchActivities()
        } else {
          $q.notify({
            type: 'negative',
            message: response.data.message || 'خطا در ثبت گزارش',
            position: 'top'
          })
        }
      } catch (error) {
        console.error('Save report error:', error)
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'خطا در ثبت گزارش',
          position: 'top'
        })
      } finally {
        saving.value = false
      }
    }

    // ============================================================
    // نمایش گزارش
    // ============================================================
    const viewReport = (row) => {
      if (row.report) {
        viewingReport.value = row.report
      } else {
        viewingReport.value = 'هنوز گزارشی برای این فعالیت ثبت نشده است.'
      }
      viewReportDialog.value = true
    }

    // ============================================================
    // باز کردن فرم
    // ============================================================
    const openForm = (formCode) => {
      $q.notify({
        type: 'info',
        message: `باز کردن کاربرگ ${formCode}`,
        position: 'top'
      })
      // اینجا می‌توانید به صفحه فرم‌ها هدایت کنید
    }

    return {
      search,
      dialog,
      reportDialog,
      viewReportDialog,
      editing,
      loading,
      saving,
      rows,
      form,
      taskOpts,
      reportText,
      viewingReport,
      columns,
      pagination,
      openDialog,
      save,
      deleteRow,
      goToPage,
      handleSearch,
      openReportDialog,
      saveReport,
      viewReport,
      openForm,
      truncateText
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

.report-btn {
  padding: 4px 12px;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &--form {
    background: #e0f2fe;
    color: #0284c7;
    border: 1px solid #7dd3fc;
    
    &:hover {
      background: #bae6fd;
    }
  }
  
  &--done {
    background: #d1fae5;
    color: #059669;
    border: 1px solid #6ee7b7;
    
    &:hover {
      background: #a7f3d0;
    }
  }
  
  &--new {
    background: #fef3c7;
    color: #d97706;
    border: 1px solid #fde047;
    
    &:hover {
      background: #fde68a;
    }
  }
}

.act-view {
  background: #e0f2fe !important;
  color: #0284c7 !important;
  
  &:hover {
    background: #bae6fd !important;
  }
}

.report-view-box {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  min-height: 120px;
  
  p {
    margin: 0;
    line-height: 1.8;
    color: #334155;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
}
</style>
