<!-- src/pages/TargetsPage.vue -->
<template>
  <div class="targets-page">
    <!-- نمایش اهداف -->
    <div v-if="viewMode === 'targets'" class="content-section">
      <div class="section-header">
        <h2>اهداف</h2>
        <q-btn 
          v-if="isAdmin"
          unelevated 
          color="primary" 
          icon="add" 
          label="افزودن هدف" 
          @click="openTargetDialog()"
        />
      </div>

      <q-table
        :rows="targets"
        :columns="targetColumns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[10, 25, 50]"
        :pagination="{ rowsPerPage: 10 }"
        flat
        bordered
        class="data-table"
      >
        <template #body-cell-code="props">
          <q-td :props="props">{{ truncateText(props.row.code, 20) }}</q-td>
        </template>
        <template #body-cell-title="props">
          <q-td :props="props">{{ truncateText(props.row.title, 50) }}</q-td>
        </template>
        <template #body-cell-year="props">
          <q-td :props="props">{{ truncateText(props.row.year, 20) }}</q-td>
        </template>
        <template #body-cell-programs="props">
          <q-td :props="props">
            <q-chip size="sm" color="primary" text-color="white">
              {{ getProgramsCount(props.row.id) }}
            </q-chip>
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn 
              v-if="isAdmin"
              flat dense round icon="edit" color="primary" size="sm"
              @click="openTargetDialog(props.row)"
            />
            <q-btn 
              v-if="isAdmin"
              flat dense round icon="delete" color="negative" size="sm"
              @click="deleteTarget(props.row.id)"
            />
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- نمایش برنامه‌ها -->
    <div v-if="viewMode === 'programs'" class="content-section">
      <div class="section-header">
        <h2>برنامه‌های هدف: {{ selectedTargetTitle }}</h2>
        <q-btn 
          unelevated 
          color="primary" 
          icon="add" 
          label="افزودن برنامه" 
          @click="openProgramDialog()"
        />
      </div>

      <q-table
        :rows="filteredPrograms"
        :columns="programColumns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[10, 25, 50]"
        :pagination="{ rowsPerPage: 10 }"
        flat
        bordered
        class="data-table"
      >
        <template #body-cell-title="props">
          <q-td :props="props">{{ truncateText(props.row.title, 50) }}</q-td>
        </template>
        <template #body-cell-target="props">
          <q-td :props="props">{{ truncateText(props.row.target?.title, 50) }}</q-td>
        </template>
        <template #body-cell-tasks="props">
          <q-td :props="props">
            <q-chip size="sm" color="primary" text-color="white">
              {{ getTasksCount(props.row.id) }}
            </q-chip>
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat dense round icon="edit" color="primary" size="sm"
              @click="openProgramDialog(props.row)"
            />
            <q-btn flat dense round icon="delete" color="negative" size="sm"
              @click="deleteProgram(props.row.id)"
            />
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- نمایش اقدامات -->
    <div v-if="viewMode === 'tasks'" class="content-section">
      <div class="section-header">
        <h2>اقدامات برنامه: {{ selectedProgramTitle }}</h2>
        <q-btn 
          unelevated 
          color="primary" 
          icon="add" 
          label="افزودن اقدام" 
          @click="openTaskDialog()"
        />
      </div>

      <q-table
        :rows="filteredTasks"
        :columns="taskColumns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[10, 25, 50]"
        :pagination="{ rowsPerPage: 10 }"
        flat
        bordered
        class="data-table"
      >
        <template #body-cell-code="props">
          <q-td :props="props">{{ truncateText(props.row.code, 20) }}</q-td>
        </template>
        <template #body-cell-title="props">
          <q-td :props="props">{{ truncateText(props.row.title, 50) }}</q-td>
        </template>
        <template #body-cell-target="props">
          <q-td :props="props">{{ truncateText(props.row.target?.title, 50) }}</q-td>
        </template>
        <template #body-cell-program="props">
          <q-td :props="props">{{ truncateText(props.row.program?.title, 50) }}</q-td>
        </template>
        <template #body-cell-activities="props">
          <q-td :props="props">
            <q-chip size="sm" color="primary" text-color="white">
              {{ getActivitiesCount(props.row.id) }}
            </q-chip>
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat dense round icon="edit" color="primary" size="sm"
              @click="openTaskDialog(props.row)"
            />
            <q-btn flat dense round icon="delete" color="negative" size="sm"
              @click="deleteTask(props.row.id)"
            />
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- نمایش فعالیت‌ها -->
    <div v-if="viewMode === 'activities'" class="content-section">
      <div class="section-header">
        <h2>فعالیت‌های اقدام: {{ selectedTaskTitle }}</h2>
      </div>

      <q-table
        :rows="filteredActivities"
        :columns="activityColumns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[10, 25, 50]"
        :pagination="{ rowsPerPage: 10 }"
        flat
        bordered
        class="data-table"
      >
        <template #body-cell-title="props">
          <q-td :props="props">{{ truncateText(props.row.title, 50) }}</q-td>
        </template>
        <template #body-cell-indicator="props">
          <q-td :props="props">{{ truncateText(props.row.indicator, 50) }}</q-td>
        </template>
        <template #body-cell-measure="props">
          <q-td :props="props">{{ truncateText(props.row.measure, 50) }}</q-td>
        </template>
        <template #body-cell-responsible="props">
          <q-td :props="props">{{ truncateText(props.row.responsible, 50) }}</q-td>
        </template>
        <template #body-cell-collaborator="props">
          <q-td :props="props">{{ truncateText(props.row.collaborator, 50) }}</q-td>
        </template>
        <template #body-cell-report="props">
          <q-td :props="props">
            <q-btn 
              v-if="props.row.form_code"
              flat 
              dense 
              color="primary" 
              :label="props.row.form_code"
              @click="openForm(props.row.form_code)"
            />
            <q-btn 
              v-else-if="props.row.report"
              flat 
              dense 
              color="positive" 
              label="اقدام شده"
              @click="viewReport(props.row)"
            />
            <q-btn 
              v-else
              flat 
              dense 
              color="secondary" 
              label="ثبت گزارش"
              @click="openReportDialog(props.row)"
            />
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn 
              flat dense round icon="visibility" color="info" size="sm"
              @click="viewReport(props.row)"
              title="نمایش گزارش"
            />
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- دیالوگ‌ها -->
    <q-dialog v-model="targetDialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>{{ editingTarget ? 'ویرایش هدف' : 'افزودن هدف' }}</h3>
          <button class="dialog-close" @click="targetDialog=false">
            <q-icon name="close" size="20px" />
          </button>
        </div>
        <div class="dialog-body">
          <q-input v-model="targetForm.code" label="کد هدف" outlined dense />
          <q-input v-model="targetForm.title" label="عنوان هدف" outlined dense />
          <q-input v-model="targetForm.year" label="سال" outlined dense />
          <q-select 
            v-if="isAdmin"
            v-model="targetForm.unit_id" 
            :options="unitOptions" 
            label="واحد" 
            outlined 
            dense 
            emit-value
            map-options
          />
        </div>
        <div class="dialog-actions">
          <q-btn label="انصراف" flat @click="targetDialog=false" />
          <q-btn label="ذخیره" color="primary" unelevated @click="saveTarget" :loading="saving" />
        </div>
      </div>
    </q-dialog>

    <!-- سایر دیالوگ‌ها به همین شکل... -->
    <q-dialog v-model="reportDialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>ثبت گزارش عملکرد</h3>
          <button class="dialog-close" @click="reportDialog=false">
            <q-icon name="close" size="20px" />
          </button>
        </div>
        <div class="dialog-body">
          <q-input 
            v-model="reportText" 
            label="توضیحات گزارش" 
            type="textarea"
            rows="5"
            outlined 
          />
        </div>
        <div class="dialog-actions">
          <q-btn label="انصراف" flat @click="reportDialog=false" />
          <q-btn label="ذخیره" color="primary" unelevated @click="saveReport" :loading="saving" />
        </div>
      </div>
    </q-dialog>

    <!-- دیالوگ نمایش گزارش -->
    <q-dialog v-model="viewReportDialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>نمایش گزارش عملکرد</h3>
          <button class="dialog-close" @click="viewReportDialog=false">
            <q-icon name="close" size="20px" />
          </button>
        </div>
        <div class="dialog-body">
          <div class="report-view">
            <p>{{ viewingReport }}</p>
          </div>
        </div>
        <div class="dialog-actions">
          <q-btn label="بستن" color="primary" unelevated @click="viewReportDialog=false" />
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

export default {
  setup() {
    const $q = useQuasar()
    const router = useRouter()
    const route = useRoute()

    const loading = ref(false)
    const saving = ref(false)
    const targets = ref([])
    const programs = ref([])
    const tasks = ref([])
    const activities = ref([])
    const units = ref([])

    const targetDialog = ref(false)
    const reportDialog = ref(false)
    const viewReportDialog = ref(false)
    const editingTarget = ref(null)
    const targetForm = ref({ code: '', title: '', year: '', unit_id: null })
    const reportText = ref('')
    const reportingActivity = ref(null)
    const viewingReport = ref('')

    // اطلاعات کاربر
    const userData = ref(null)
    const loadUserData = () => {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          userData.value = JSON.parse(userStr)
        } catch (e) {
          userData.value = null
        }
      }
    }

    const isAdmin = computed(() => userData.value?.role?.code === 'ADMIN')
    const userUnitId = computed(() => userData.value?.unit_id)

    // تشخیص حالت نمایش بر اساس query parameters
    const viewMode = computed(() => {
      if (route.query.task_id) return 'activities'
      if (route.query.program_id) return 'tasks'
      if (route.query.target_id) return 'programs'
      return 'targets'
    })

    const selectedTargetId = computed(() => route.query.target_id ? parseInt(route.query.target_id) : null)
    const selectedProgramId = computed(() => route.query.program_id ? parseInt(route.query.program_id) : null)
    const selectedTaskId = computed(() => route.query.task_id ? parseInt(route.query.task_id) : null)

    const selectedTargetTitle = computed(() => {
      const target = targets.value.find(t => t.id === selectedTargetId.value)
      return target ? target.title : ''
    })

    const selectedProgramTitle = computed(() => {
      const program = programs.value.find(p => p.id === selectedProgramId.value)
      return program ? program.title : ''
    })

    const selectedTaskTitle = computed(() => {
      const task = tasks.value.find(t => t.id === selectedTaskId.value)
      return task ? task.title : ''
    })

    const filteredPrograms = computed(() => {
      if (!selectedTargetId.value) return programs.value
      return programs.value.filter(p => p.target_id === selectedTargetId.value)
    })

    const filteredTasks = computed(() => {
      if (!selectedProgramId.value) return tasks.value
      return tasks.value.filter(t => t.program_id === selectedProgramId.value)
    })

    const filteredActivities = computed(() => {
      if (!selectedTaskId.value) return activities.value
      return activities.value.filter(a => a.task_id === selectedTaskId.value)
    })

    // ستون‌های جداول
    const targetColumns = [
      { name: 'code', label: 'کد هدف', field: 'code', align: 'right', sortable: true },
      { name: 'title', label: 'عنوان هدف', field: 'title', align: 'right', sortable: true },
      { name: 'year', label: 'سال', field: 'year', align: 'right', sortable: true },
      { name: 'programs', label: 'برنامه‌ها', field: 'programs', align: 'center' },
      { name: 'actions', label: 'عملیات', field: 'actions', align: 'center' }
    ]

    const programColumns = [
      { name: 'title', label: 'عنوان برنامه', field: 'title', align: 'right', sortable: true },
      { name: 'target', label: 'هدف مرتبط', field: 'target', align: 'right' },
      { name: 'tasks', label: 'اقدامات', field: 'tasks', align: 'center' },
      { name: 'actions', label: 'عملیات', field: 'actions', align: 'center' }
    ]

    const taskColumns = [
      { name: 'code', label: 'کد اقدام', field: 'code', align: 'right', sortable: true },
      { name: 'title', label: 'عنوان اقدام', field: 'title', align: 'right', sortable: true },
      { name: 'target', label: 'هدف', field: 'target', align: 'right' },
      { name: 'program', label: 'برنامه', field: 'program', align: 'right' },
      { name: 'activities', label: 'تعداد فعالیت', field: 'activities', align: 'center' },
      { name: 'actions', label: 'عملیات', field: 'actions', align: 'center' }
    ]

    const activityColumns = [
      { name: 'title', label: 'عنوان فعالیت', field: 'title', align: 'right', sortable: true },
      { name: 'indicator', label: 'شاخص', field: 'indicator', align: 'right' },
      { name: 'measure', label: 'سنجه', field: 'measure', align: 'right' },
      { name: 'responsible', label: 'مجری', field: 'responsible', align: 'right' },
      { name: 'collaborator', label: 'همکار', field: 'collaborator', align: 'right' },
      { name: 'report', label: 'گزارش عملکرد / کاربرگ', field: 'report', align: 'center' },
      { name: 'actions', label: 'عملیات', field: 'actions', align: 'center' }
    ]

    const unitOptions = computed(() => 
      units.value.map(u => ({ label: u.name, value: u.id }))
    )

    const getFilterParams = () => {
      if (isAdmin.value) return {}
      return { unit_id: userUnitId.value }
    }

    const getProgramsCount = (targetId) => {
      return programs.value.filter(p => p.target_id === targetId).length
    }

    const getTasksCount = (programId) => {
      return tasks.value.filter(t => t.program_id === programId).length
    }

    const getActivitiesCount = (taskId) => {
      return activities.value.filter(a => a.task_id === taskId).length
    }

    const loadData = async () => {
      loading.value = true
      try {
        const filterParams = getFilterParams()
        
        const [targetsRes, programsRes, tasksRes, activitiesRes, unitsRes] = await Promise.all([
          api.get('/targets', { params: { ...filterParams, per_page: 100 } }),
          api.get('/programs', { params: { ...filterParams, per_page: 100 } }),
          api.get('/tasks', { params: { ...filterParams, per_page: 100 } }),
          api.get('/activities', { params: { ...filterParams, per_page: 100 } }),
          isAdmin.value ? api.get('/units', { params: { per_page: 100 } }) : Promise.resolve({ data: { data: [] } })
        ])

        targets.value = targetsRes.data.data || []
        programs.value = programsRes.data.data || []
        tasks.value = tasksRes.data.data || []
        activities.value = activitiesRes.data.data || []
        units.value = unitsRes.data.data || []
      } catch (error) {
        console.error('Load data error:', error)
        $q.notify({ type: 'negative', message: 'خطا در بارگذاری داده‌ها' })
      } finally {
        loading.value = false
      }
    }

    const openTargetDialog = (target = null) => {
      if (target) {
        editingTarget.value = target
        targetForm.value = { ...target }
      } else {
        editingTarget.value = null
        targetForm.value = { code: '', title: '', year: '', unit_id: userUnitId.value }
      }
      targetDialog.value = true
    }

    const saveTarget = async () => {
      saving.value = true
      try {
        if (editingTarget.value) {
          await api.put(`/targets/${editingTarget.value.id}`, targetForm.value)
          $q.notify({ type: 'positive', message: 'هدف با موفقیت ویرایش شد' })
        } else {
          await api.post('/targets', targetForm.value)
          $q.notify({ type: 'positive', message: 'هدف با موفقیت اضافه شد' })
        }
        targetDialog.value = false
        loadData()
      } catch (error) {
        $q.notify({ type: 'negative', message: 'خطا در ذخیره هدف' })
      } finally {
        saving.value = false
      }
    }

    const deleteTarget = (id) => {
      $q.dialog({
        title: 'حذف هدف',
        message: 'آیا از حذف این هدف مطمئن هستید؟',
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          await api.delete(`/targets/${id}`)
          $q.notify({ type: 'positive', message: 'هدف با موفقیت حذف شد' })
          loadData()
        } catch (error) {
          $q.notify({ type: 'negative', message: 'خطا در حذف هدف' })
        }
      })
    }

    const openForm = (formCode) => {
      router.push('/forms')
    }

    const openReportDialog = (activity) => {
      reportingActivity.value = activity
      reportText.value = activity.report || ''
      reportDialog.value = true
    }

    const saveReport = async () => {
      saving.value = true
      try {
        await api.put(`/activities/${reportingActivity.value.id}`, {
          ...reportingActivity.value,
          report: reportText.value
        })
        $q.notify({ type: 'positive', message: 'گزارش با موفقیت ثبت شد' })
        reportDialog.value = false
        loadData()
      } catch (error) {
        $q.notify({ type: 'negative', message: 'خطا در ثبت گزارش' })
      } finally {
        saving.value = false
      }
    }

    const viewReport = (activity) => {
      if (activity.report) {
        viewingReport.value = activity.report
      } else {
        viewingReport.value = 'هنوز گزارشی برای این فعالیت ثبت نشده است.'
      }
      viewReportDialog.value = true
    }

    const openProgramDialog = () => {
      $q.notify({ type: 'info', message: 'این قابلیت به زودی اضافه می‌شود' })
    }

    const deleteProgram = () => {
      $q.notify({ type: 'info', message: 'این قابلیت به زودی اضافه می‌شود' })
    }

    const openTaskDialog = () => {
      $q.notify({ type: 'info', message: 'این قابلیت به زودی اضافه می‌شود' })
    }

    const deleteTask = () => {
      $q.notify({ type: 'info', message: 'این قابلیت به زودی اضافه می‌شود' })
    }

    const openActivityDialog = () => {
      $q.notify({ type: 'info', message: 'این قابلیت به زودی اضافه می‌شود' })
    }

    const deleteActivity = () => {
      $q.notify({ type: 'info', message: 'این قابلیت به زودی اضافه می‌شود' })
    }

    // ============================================================
    // تابع برش متن برای نمایش محدود
    // ============================================================
    const truncateText = (text, maxLength = 50) => {
      if (!text) return '—'
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }

    onMounted(() => {
      loadUserData()
      loadData()
    })

    return {
      loading,
      saving,
      targets,
      programs,
      tasks,
      activities,
      viewMode,
      targetDialog,
      reportDialog,
      viewReportDialog,
      editingTarget,
      targetForm,
      reportText,
      viewingReport,
      isAdmin,
      unitOptions,
      targetColumns,
      programColumns,
      taskColumns,
      activityColumns,
      selectedTargetTitle,
      selectedProgramTitle,
      selectedTaskTitle,
      filteredPrograms,
      filteredTasks,
      filteredActivities,
      getProgramsCount,
      getTasksCount,
      getActivitiesCount,
      openTargetDialog,
      saveTarget,
      deleteTarget,
      openForm,
      openReportDialog,
      saveReport,
      viewReport,
      openProgramDialog,
      deleteProgram,
      openTaskDialog,
      deleteTask,
      openActivityDialog,
      deleteActivity,
      truncateText
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/pages/page-shared.scss';

.targets-page {
  padding: 20px;
}

.content-section {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
  }
}

.data-table {
  width: 100%;
}

.report-view {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  min-height: 100px;
  
  p {
    margin: 0;
    line-height: 1.8;
    color: #334155;
    white-space: pre-wrap;
  }
}
</style>
