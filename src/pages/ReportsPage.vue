<!-- src/pages/ReportsPage.vue -->
<template>
  <div class="page-root">

    <PageHeader title="گزارش‌گیری" subtitle="گزارش‌های پیشرفته از کاربرگ‌ها و خروجی Excel" icon="insert_chart">
      <q-btn 
        unelevated 
        color="primary" 
        icon="download" 
        label="خروجی Excel" 
        @click="exportExcel" 
        :loading="exporting" 
        :disable="forms.length === 0"
      />
    </PageHeader>

    <!-- فیلترها -->
    <div class="filter-card">
      <div class="filter-card-title">
        <q-icon name="filter_alt" size="18px" class="q-ml-sm" />
        فیلترهای گزارش
      </div>
      <div class="filter-grid">

        <div class="form-group" v-if="isAdmin">
          <label>واحد</label>
          <q-select 
            v-model="filters.unit_id" 
            outlined 
            dense 
            :options="unitOptions" 
            option-value="id"
            option-label="name"
            emit-value
            map-options
            clearable
          />
        </div>
        <div class="form-group">
          <label>هدف</label>
          <q-select 
            v-model="filters.target_id" 
            outlined 
            dense 
            :options="targetOptions" 
            option-value="id"
            option-label="title"
            emit-value
            map-options
            clearable
          />
        </div>
        <div class="form-group">
          <label>برنامه</label>
          <q-select 
            v-model="filters.program_id" 
            outlined 
            dense 
            :options="programOptions" 
            option-value="id"
            option-label="title"
            emit-value
            map-options
            clearable
          />
        </div>
        <div class="form-group">
          <label>وضعیت</label>
          <q-select 
            v-model="filters.is_completed" 
            outlined 
            dense 
            :options="statusOptions"
            clearable
          />
        </div>
        <div class="form-group">
          <label>جستجو</label>
          <q-input 
            v-model="filters.search" 
            outlined 
            dense 
            placeholder="جستجو در کد کاربرگ..."
            clearable
          />
        </div>
      </div>
      <div class="filter-actions">
        <q-btn 
          unelevated 
          color="primary" 
          icon="search" 
          label="ایجاد گزارش" 
          @click="loadReport" 
          :loading="loading"
        />
        <q-btn flat icon="refresh" label="پاک کردن فیلترها" @click="clearFilters" />
      </div>
    </div>

    <!-- کارت‌های خلاصه -->
    <div class="summary-grid" v-if="statistics">
      <div class="summary-card">
        <div class="summary-icon" style="background: #ecfdf5">
          <q-icon name="description" size="20px" style="color: #1e8a5e" />
        </div>
        <div class="summary-body">
          <span class="summary-label">کل کاربرگ‌ها</span>
          <span class="summary-value">{{ statistics.summary.total_forms }}</span>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon" style="background: #f0fdf4">
          <q-icon name="task_alt" size="20px" style="color: #16a34a" />
        </div>
        <div class="summary-body">
          <span class="summary-label">تکمیل شده</span>
          <span class="summary-value">{{ statistics.summary.completed_forms }}</span>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon" style="background: #fff7ed">
          <q-icon name="pending_actions" size="20px" style="color: #f59e0b" />
        </div>
        <div class="summary-body">
          <span class="summary-label">در انتظار تکمیل</span>
          <span class="summary-value">{{ statistics.summary.incomplete_forms }}</span>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon" style="background: #eff6ff">
          <q-icon name="trending_up" size="20px" style="color: #3b82f6" />
        </div>
        <div class="summary-body">
          <span class="summary-label">درصد تکمیل</span>
          <span class="summary-value">{{ statistics.summary.completion_percentage }}%</span>
        </div>
      </div>
    </div>



    <!-- جدول تفصیلی -->
    <div class="table-card">
      <div class="table-head-bar">
        <div>
          <h3 class="card-title">لیست کاربرگ‌ها</h3>
          <p class="card-sub">{{ forms.length }} کاربرگ یافت شد</p>
        </div>
        <div class="table-actions">
          <q-btn 
            flat 
            dense 
            icon="refresh" 
            @click="loadReport"
            :loading="loading"
          />
        </div>
      </div>

      <q-table
        :rows="forms"
        :columns="tableColumns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[10, 25, 50]"
        rows-per-page-label="تعداد در صفحه:"
        :no-data-label="loading ? 'در حال بارگذاری...' : 'کاربرگی یافت نشد'"
        class="reports-table"
      >
        <template v-slot:body-cell-code="props">
          <q-td :props="props">
            <q-btn
              flat
              dense
              color="primary"
              :label="props.value"
              @click="viewFormDetails(props.row.id)"
              class="code-link"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-is_completed="props">
          <q-td :props="props">
            <q-badge 
              :color="props.value ? 'positive' : 'warning'" 
              :label="props.value ? 'تکمیل شده' : 'در انتظار'"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-created_at="props">
          <q-td :props="props">
            {{ formatDate(props.value) }}
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <div class="row-actions">
              <q-btn
                flat
                dense
                round
                color="primary"
                icon="visibility"
                @click="viewFormDetails(props.row.id)"
                size="sm"
              >
                <q-tooltip>مشاهده جزئیات</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                round
                color="positive"
                icon="download"
                @click="exportSingleForm(props.row.id, props.row.code)"
                size="sm"
              >
                <q-tooltip>دانلود Excel</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- دیالوگ جزئیات کاربرگ -->
    <q-dialog v-model="showDetailsDialog" maximized>
      <q-card class="details-dialog">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">جزئیات کاربرگ {{ selectedForm?.code }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="details-content" v-if="selectedForm">
          <!-- اطلاعات کلی -->
          <div class="details-section">
            <h4>اطلاعات کلی</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>کد کاربرگ:</label>
                <span>{{ selectedForm.code }}</span>
              </div>
              <div class="info-item">
                <label>واحد:</label>
                <span>{{ selectedForm.unit?.name || '—' }}</span>
              </div>
              <div class="info-item">
                <label>هدف:</label>
                <span>{{ selectedForm.target?.code }} - {{ selectedForm.target?.title || '—' }}</span>
              </div>
              <div class="info-item">
                <label>برنامه:</label>
                <span>{{ selectedForm.program?.code }} - {{ selectedForm.program?.title || '—' }}</span>
              </div>
              <div class="info-item" v-if="selectedForm.task">
                <label>اقدام:</label>
                <span>{{ selectedForm.task.code }} - {{ selectedForm.task.title }}</span>
              </div>
              <div class="info-item" v-if="selectedForm.activity">
                <label>فعالیت:</label>
                <span>{{ selectedForm.activity.title }}</span>
              </div>
              <div class="info-item">
                <label>وضعیت:</label>
                <q-badge 
                  :color="selectedForm.is_completed ? 'positive' : 'warning'" 
                  :label="selectedForm.is_completed ? 'تکمیل شده' : 'در انتظار تکمیل'"
                />
              </div>
              <div class="info-item">
                <label>تاریخ ایجاد:</label>
                <span>{{ formatDate(selectedForm.created_at) }}</span>
              </div>
            </div>
          </div>

          <!-- فیلدهای متغیر -->
          <div class="details-section" v-if="selectedFormFields?.length">
            <h4>فیلدهای متغیر</h4>
            <div class="fields-grid">
              <div 
                v-for="field in selectedFormFields" 
                :key="field.id"
                class="field-item"
              >
                <label>{{ field.field_label }}:</label>
                <div class="field-values">
                  <div 
                    v-for="value in field.values" 
                    :key="value.id"
                    class="field-value"
                  >
                    <span class="value">{{ value.field_value || '—' }}</span>
                    <small class="creator">توسط: {{ value.created_by }}</small>
                  </div>
                  <div v-if="!field.values.length" class="no-value">مقدار ثبت نشده</div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="details-actions">
          <q-btn
            unelevated
            color="positive"
            icon="download"
            label="دانلود Excel"
            @click="exportSingleForm(selectedForm.id, selectedForm.code)"
            v-if="selectedForm"
          />
          <q-btn flat label="بستن" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import Chart from 'chart.js/auto'
import PageHeader from 'components/PageHeader.vue'
import { useAuthStore } from 'stores/auth'

export default {
  components: { PageHeader },
  setup () {
    const $q = useQuasar()
    const authStore = useAuthStore()
    
    // Refs
    const barChart = ref(null)
    const donutChart = ref(null)
    const loading = ref(false)
    const exporting = ref(false)
    const showDetailsDialog = ref(false)
    
    // Data
    const statistics = ref(null)
    const forms = ref([])
    const units = ref([])
    const targets = ref([])
    const programs = ref([])
    const selectedForm = ref(null)
    const selectedFormFields = ref([])
    
    // Charts
    let barChartInstance = null
    let donutChartInstance = null
    
    // Computed
    const isAdmin = computed(() => authStore.user?.role?.slug === 'ADMIN')
    
    // Filters
    const filters = ref({
      unit_id: null,
      target_id: null,
      program_id: null,
      is_completed: null,
      search: null,
    })
    
    // Options
    const unitOptions = computed(() => units.value)
    const targetOptions = computed(() => targets.value)
    const programOptions = computed(() => programs.value.filter(p => 
      !filters.value.target_id || p.target_id === filters.value.target_id
    ))
    
    const statusOptions = [
      { label: 'تکمیل شده', value: true },
      { label: 'در انتظار تکمیل', value: false }
    ]
    
    // Table columns
    const tableColumns = [
      {
        name: 'code',
        required: true,
        label: 'کد کاربرگ',
        align: 'left',
        field: 'code',
        sortable: true
      },
      {
        name: 'unit',
        label: 'واحد',
        align: 'left',
        field: row => row.unit?.name || '—',
        sortable: true
      },
      {
        name: 'target',
        label: 'هدف',
        align: 'left',
        field: row => `${row.target?.code || ''} - ${row.target?.title || '—'}`,
        sortable: false
      },
      {
        name: 'program',
        label: 'برنامه',
        align: 'left',
        field: row => `${row.program?.code || ''} - ${row.program?.title || '—'}`,
        sortable: false
      },
      {
        name: 'is_completed',
        label: 'وضعیت',
        align: 'center',
        field: 'is_completed',
        sortable: true
      },
      {
        name: 'created_at',
        label: 'تاریخ ایجاد',
        align: 'left',
        field: 'created_at',
        sortable: true
      },
      {
        name: 'actions',
        label: 'عملیات',
        align: 'center',
        field: 'actions',
        sortable: false
      }
    ]
    
    // Methods
    const loadInitialData = async () => {
      try {
        // Load units (if admin)
        if (isAdmin.value) {
          const unitsResponse = await api.get('/units')
          if (unitsResponse.data.success) {
            units.value = unitsResponse.data.data
          }
        }
        
        // Load targets
        const targetsResponse = await api.get('/targets')
        if (targetsResponse.data.success) {
          targets.value = targetsResponse.data.data
        }
        
        // Load programs
        const programsResponse = await api.get('/programs')
        if (programsResponse.data.success) {
          programs.value = programsResponse.data.data
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
        $q.notify({
          type: 'negative',
          message: 'خطا در بارگذاری اطلاعات اولیه',
          position: 'top'
        })
      }
    }
    
    const loadStatistics = async () => {
      try {
        const params = new URLSearchParams()
        Object.entries(filters.value).forEach(([key, value]) => {
          if (value !== null && value !== '') {
            params.append(key, value)
          }
        })
        
        const response = await api.get(`/reports/statistics?${params}`)
        if (response.data.success) {
          statistics.value = response.data.data
          updateCharts()
        }
      } catch (error) {
        console.error('Error loading statistics:', error)
        $q.notify({
          type: 'negative',
          message: 'خطا در بارگذاری آمار',
          position: 'top'
        })
      }
    }
    
    const loadForms = async () => {
      try {
        const params = new URLSearchParams()
        Object.entries(filters.value).forEach(([key, value]) => {
          if (value !== null && value !== '') {
            params.append(key, value)
          }
        })
        params.append('per_page', '100') // Load more items for report
        
        const response = await api.get(`/reports/list?${params}`)
        if (response.data.success) {
          forms.value = response.data.data
        }
      } catch (error) {
        console.error('Error loading forms:', error)
        $q.notify({
          type: 'negative',
          message: 'خطا در بارگذاری کاربرگ‌ها',
          position: 'top'
        })
      }
    }
    
    const loadReport = async () => {
      loading.value = true
      try {
        await Promise.all([
          loadStatistics(),
          loadForms()
        ])
        $q.notify({
          type: 'positive',
          message: 'گزارش با موفقیت بارگذاری شد',
          position: 'top'
        })
      } finally {
        loading.value = false
      }
    }
    
    const clearFilters = () => {
      Object.keys(filters.value).forEach(key => {
        filters.value[key] = null
      })
    }
    
    const exportExcel = async () => {
      if (forms.value.length === 0) {
        $q.notify({
          type: 'warning',
          message: 'هیچ کاربرگی برای خروجی یافت نشد',
          position: 'top'
        })
        return
      }
      
      exporting.value = true
      try {
        const params = new URLSearchParams()
        Object.entries(filters.value).forEach(([key, value]) => {
          if (value !== null && value !== '') {
            params.append(key, value)
          }
        })
        
        const response = await api.get(`/reports/export?${params}`, {
          responseType: 'blob'
        })
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        
        const filename = `report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`
        link.setAttribute('download', filename)
        
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        
        $q.notify({
          type: 'positive',
          message: 'فایل با موفقیت دانلود شد',
          position: 'top'
        })
      } catch (error) {
        console.error('Error exporting:', error)
        $q.notify({
          type: 'negative',
          message: 'خطا در دانلود فایل',
          position: 'top'
        })
      } finally {
        exporting.value = false
      }
    }
    
    const exportSingleForm = async (formId, formCode) => {
      try {
        const response = await api.get(`/forms/${formId}/export`, {
          responseType: 'blob'
        })
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${formCode}.xlsx`)
        
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        
        $q.notify({
          type: 'positive',
          message: 'فایل با موفقیت دانلود شد',
          position: 'top'
        })
      } catch (error) {
        console.error('Error exporting single form:', error)
        $q.notify({
          type: 'negative',
          message: 'خطا در دانلود فایل',
          position: 'top'
        })
      }
    }
    
    const viewFormDetails = async (formId) => {
      try {
        const response = await api.get(`/reports/details/${formId}`)
        if (response.data.success) {
          selectedForm.value = response.data.data.form
          selectedFormFields.value = response.data.data.fields
          showDetailsDialog.value = true
        }
      } catch (error) {
        console.error('Error loading form details:', error)
        $q.notify({
          type: 'negative',
          message: 'خطا در بارگذاری جزئیات کاربرگ',
          position: 'top'
        })
      }
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return '—'
      const date = new Date(dateString)
      return date.toLocaleDateString('fa-IR')
    }
    
    const truncateText = (text, length) => {
      if (!text) return '—'
      return text.length > length ? text.substring(0, length) + '...' : text
    }
    
    const getTargetColor = (index) => {
      const colors = ['#1e8a5e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#a855f7']
      return colors[index % colors.length]
    }
    
    const updateCharts = () => {
      if (!statistics.value) return
      
      // Update Bar Chart
      if (barChartInstance) {
        barChartInstance.destroy()
      }
      
      // فقط برای ادمین و اگر داده موجود باشد
      if (barChart.value && isAdmin.value && statistics.value.by_unit.length > 0) {
        // فیلتر واحدهایی که حداقل یک کاربرگ دارند
        const unitsWithForms = statistics.value.by_unit.filter(unit => unit.total_forms > 0)
        
        if (unitsWithForms.length > 0) {
          const ctx = barChart.value.getContext('2d')
          barChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: unitsWithForms.map(unit => unit.name),
              datasets: [{
                label: 'تعداد کاربرگ',
                data: unitsWithForms.map(unit => unit.total_forms),
                backgroundColor: (ctx) => {
                  const canvas = ctx.chart.ctx
                  const gradient = canvas.createLinearGradient(0, 0, 0, 260)
                  gradient.addColorStop(0, '#1e8a5e')
                  gradient.addColorStop(1, '#4caf87')
                  return gradient
                },
                borderRadius: 6,
                borderSkipped: false,
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  enabled: true,
                  callbacks: {
                    label: function(context) {
                      return context.dataset.label + ': ' + context.parsed.y + ' کاربرگ'
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: '#f1f5f9' },
                  ticks: {
                    font: { family: 'Vazirmatn', size: 11 },
                    color: '#94a3b8',
                    stepSize: 1
                  }
                },
                x: {
                  grid: { display: false },
                  ticks: {
                    font: { family: 'Vazirmatn', size: 11 },
                    color: '#64748b'
                  }
                }
              }
            }
          })
        }
      }
      
      // Update Donut Chart
      if (donutChartInstance) {
        donutChartInstance.destroy()
      }
      
      if (donutChart.value && statistics.value.by_target.length > 0) {
        const ctx = donutChart.value.getContext('2d')
        // استفاده از تمام اهداف، نه فقط 5 تا
        const allTargets = statistics.value.by_target
        
        // ایجاد رنگ‌های متنوع برای تمام اهداف
        const colors = []
        const baseColors = ['#1e8a5e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#a855f7']
        
        for (let i = 0; i < allTargets.length; i++) {
          colors.push(baseColors[i % baseColors.length])
        }
        
        donutChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: allTargets.map(target => `${target.code}: ${target.title}`),
            datasets: [{
              data: allTargets.map(target => target.total_forms),
              backgroundColor: colors,
              borderWidth: 0,
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                callbacks: {
                  label: function(context) {
                    return context.label + ': ' + context.parsed + ' کاربرگ'
                  }
                }
              }
            }
          }
        })
      }
    }
    
    // Watchers
    watch(() => filters.value.target_id, () => {
      // Reset program filter when target changes
      filters.value.program_id = null
    })
    
    // Lifecycle
    onMounted(async () => {
      await loadInitialData()
      await loadReport() // Load initial report
    })
    
    return {
      // Refs
      barChart,
      donutChart,
      loading,
      exporting,
      showDetailsDialog,
      
      // Data
      statistics,
      forms,
      selectedForm,
      selectedFormFields,
      filters,
      
      // Computed
      isAdmin,
      unitOptions,
      targetOptions,
      programOptions,
      statusOptions,
      tableColumns,
      
      // Methods
      loadReport,
      clearFilters,
      exportExcel,
      exportSingleForm,
      viewFormDetails,
      formatDate,
      truncateText,
      getTargetColor
    }
  }
}
</script>

<style lang="scss" scoped>
@import './page-shared.scss';

.filter-card {
  background: #fff; border: 1.5px solid #c6e8d8; border-radius: 14px;
  padding: 20px; margin-bottom: 20px;
}
.filter-card-title {
  font-size: 14px; font-weight: 700; color: #334155;
  display: flex; align-items: center; margin-bottom: 16px;
}
.filter-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
  gap: 14px; 
  margin-bottom: 16px; 
}
.filter-actions { display: flex; align-items: center; gap: 8px; }

.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.summary-card {
  background: #fff; border: 1.5px solid #c6e8d8; border-radius: 14px;
  padding: 18px; display: flex; align-items: center; gap: 12px;
  transition: box-shadow .2s, transform .2s;
  &:hover { box-shadow: 0 6px 24px rgba(0,0,0,.08); transform: translateY(-2px); }
}
.summary-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.summary-body { flex: 1; }
.summary-label { display: block; font-size: 11.5px; color: #64748b; margin-bottom: 3px; }
.summary-value { display: block; font-size: 26px; font-weight: 800; color: #0f172a; line-height: 1; }

.charts-row { display: grid; grid-template-columns: 1fr 300px; gap: 16px; margin-bottom: 20px; }
.chart-card { background: #fff; border: 1.5px solid #c6e8d8; border-radius: 14px; padding: 20px; }
.chart-card--full { grid-column: 1 / -1; }
.card-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
.card-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
.card-sub   { font-size: 12px; color: #94a3b8; }
.chart-wrap { height: 220px; position: relative; }
.donut-wrap { height: 160px; position: relative; margin-bottom: 14px; }
.donut-legend { display: flex; flex-direction: column; gap: 7px; max-height: 200px; overflow-y: auto; padding-right: 8px; }
.donut-legend::-webkit-scrollbar { width: 6px; }
.donut-legend::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
.donut-legend::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 3px; }
.donut-legend::-webkit-scrollbar-thumb:hover { background: #64748b; }
.donut-legend-item { display: flex; align-items: center; gap: 7px; font-size: 12px; }
.donut-dot   { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.donut-label { flex: 1; color: #475569; }
.donut-val   { font-weight: 700; color: #0f172a; }

.table-card { 
  background: #fff; 
  border: 1.5px solid #c6e8d8; 
  border-radius: 14px; 
  overflow: hidden; 
}

.table-head-bar { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  padding: 16px 20px; 
  border-bottom: 1px solid #f1f5f9; 
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reports-table {
  .code-link {
    text-decoration: underline;
    font-weight: 500;
  }
}

.row-actions {
  display: flex;
  gap: 4px;
  justify-content: center;
}

// Details Dialog Styles
.details-dialog {
  .details-content {
    max-height: 70vh;
    overflow-y: auto;
  }
  
  .details-section {
    margin-bottom: 24px;
    
    h4 {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
  }
  
  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    label {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
    }
    
    span {
      font-size: 14px;
      color: #0f172a;
    }
  }
  
  .fields-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .field-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 8px;
    }
  }
  
  .field-values {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .field-value {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 10px;
    
    .value {
      display: block;
      font-size: 14px;
      color: #0f172a;
      margin-bottom: 2px;
    }
    
    .creator {
      font-size: 11px;
      color: #94a3b8;
    }
  }
  
  .no-value {
    font-size: 12px;
    color: #94a3b8;
    font-style: italic;
  }
  
  .details-actions {
    border-top: 1px solid #e2e8f0;
    padding-top: 16px;
  }
}

@media (max-width: 1100px) {
  .filter-grid { grid-template-columns: repeat(2, 1fr); }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-row { 
    grid-template-columns: 1fr; 
    .chart-card--narrow, .chart-card--full {
      grid-column: auto;
    }
  }
}

@media (max-width: 600px) {
  .summary-grid { grid-template-columns: 1fr; }
  .filter-grid { grid-template-columns: 1fr; }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
