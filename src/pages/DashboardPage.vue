<!-- src/pages/DashboardPage.vue -->
<template>
  <div class="dashboard-container">

    <!-- هدر خوش‌آمدگویی -->
    <div class="welcome-section">
      <div class="welcome-text">
        <h1 class="welcome-title"> {{ userFullName }} 👋</h1>
        <p class="welcome-subtitle">به سامانه مدیریت برنامه عملیاتی سیب خوش آمدید. در اینجا می‌توانید آخرین وضعیت برنامه‌ها، اقدامات و فعالیت‌ها را مشاهده کنید.</p>
      </div>
      <div class="welcome-date">
        <div class="date-card">
          <q-icon name="calendar_today" size="20px" />
          <span>{{ persianDate }}</span>
        </div>
      </div>
    </div>

    <!-- کارت‌های آماری -->
    <div class="stats-grid">
      <div class="stat-card" v-for="(stat, index) in stats" :key="stat.title">
        <div class="stat-icon" :style="{ background: stat.bgColor }">
          <q-icon :name="stat.icon" size="28px" :color="stat.iconColor" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-title">{{ stat.title }}</div>
          <div class="stat-change" v-if="stat.change">
<!--            <q-icon :name="stat.change > 0 ? 'trending_up' : 'trending_down'" size="14px" />-->
<!--            <span :class="stat.change > 0 ? 'positive' : 'negative'">{{ Math.abs(stat.change) }}%</span>-->
<!--            <span>نسبت به ماه قبل</span>-->
          </div>
        </div>
      </div>
    </div>

    <!-- نمودار پیشرفت کاربرگ‌ها به تفکیک واحد (تمام عرض) -->
    <div class="chart-card full-width">
      <div class="card-header">
        <div class="header-title">
          <q-icon name="bar_chart" size="20px" color="#2e7d64" />
          <h3>پیشرفت کاربرگ‌ها به تفکیک واحد</h3>
        </div>
      </div>
      <div class="card-body chart-body">
        <canvas id="formsChart" style="height: 140px;"></canvas>
      </div>
    </div>

    <!-- آخرین فعالیت‌ها (تمام عرض) -->
    <div class="recent-card full-width">
      <div class="card-header">
        <div class="header-title">
          <q-icon name="history" size="20px" color="#2e7d64" />
          <h3>آخرین فعالیت‌ها</h3>
        </div>
        <q-btn flat color="primary" label="مشاهده همه" @click="$router.push('/activities')" />
      </div>
      <div class="card-body">
        <q-table
          :rows="recentActivities"
          :columns="activityColumns"
          row-key="id"
          :loading="activitiesLoading"
          hide-bottom
          flat
          dense
          :pagination="{ rowsPerPage: 5 }"
        >
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="props.row.status === 'انجام شده' ? 'positive' : 'warning'">
                {{ props.row.status }}
              </q-badge>
            </q-td>
          </template>
          <template #body-cell-progress="props">
            <q-td :props="props">
              <div class="progress-cell">
                <q-linear-progress :value="props.row.progress / 100" :color="getProgressColor(props.row.progress)" />
                <span class="progress-text">{{ props.row.progress }}%</span>
              </div>
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

    <!-- آخرین کاربرگ‌ها (تمام عرض) -->
    <div class="recent-card full-width">
      <div class="card-header">
        <div class="header-title">
          <q-icon name="description" size="20px" color="#2e7d64" />
          <h3>آخرین کاربرگ‌ها</h3>
        </div>
        <q-btn flat color="primary" label="مشاهده همه" @click="$router.push('/forms')" />
      </div>
      <div class="card-body">
        <q-table
          :rows="recentForms"
          :columns="formColumns"
          row-key="id"
          :loading="formsLoading"
          hide-bottom
          flat
          dense
          :pagination="{ rowsPerPage: 5 }"
        >
          <template #body-cell-code="props">
            <q-td :props="props">
              <code class="code-chip">{{ props.row.code }}</code>
            </q-td>
          </template>
          <template #body-cell-is_completed="props">
            <q-td :props="props">
              <q-badge :color="props.row.is_completed ? 'positive' : 'warning'">
                {{ props.row.is_completed ? 'تکمیل شده' : 'در انتظار تکمیل' }}
              </q-badge>
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import Chart from 'chart.js/auto'

export default {
  setup() {
    const $q = useQuasar()
    const router = useRouter()

    // اطلاعات کاربر
    const userData = ref(null)
    const chartLoading = ref(false)

    // وضعیت لودینگ
    const activitiesLoading = ref(false)
    const formsLoading = ref(false)

    // داده‌های آماری
    const stats = ref([
      { title: 'کل اهداف', value: 0, icon: 'flag', bgColor: '#e8f5e9', iconColor: '#2e7d64', change: 12 },
      { title: 'برنامه‌های فعال', value: 0, icon: 'assignment', bgColor: '#e3f2fd', iconColor: '#1565c0', change: 8 },
      { title: 'اقدامات در حال اجرا', value: 0, icon: 'task_alt', bgColor: '#fff3e0', iconColor: '#ef6c00', change: 5 },
      { title: 'فعالیت‌های انجام شده', value: 0, icon: 'check_circle', bgColor: '#e8f5e9', iconColor: '#2e7d64', change: 15 },
      { title: 'کاربرگ‌های تکمیل شده', value: 0, icon: 'description', bgColor: '#e0f2fe', iconColor: '#0284c7', change: 10 }
    ])

    // داده‌های نمودار
    const formsChart = ref(null)

    // داده‌های جداول
    const recentActivities = ref([])
    const recentForms = ref([])

    // تاریخ شمسی
    const persianDate = computed(() => {
      const date = new Date()
      return date.toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    })

    // نام کامل کاربر
    const userFullName = computed(() => {
      if (userData.value) {
        return `${userData.value.first_name || ''} ${userData.value.last_name || ''}`.trim() || 'کاربر'
      }
      return 'کاربر گرامی'
    })


    // نقش کاربر و unit_id
    const userRole = computed(() => userData.value?.role?.code)
    const userUnitId = computed(() => userData.value?.unit_id)
    const isAdmin = computed(() => userRole.value === 'ADMIN')

    // ستون‌های جدول فعالیت‌ها
    const activityColumns = [
      { name: 'title', label: 'عنوان فعالیت', field: 'title', align: 'right', sortable: true },
      { name: 'task', label: 'اقدام مرتبط', field: row => row.task?.title, align: 'right' },
      { name: 'responsible', label: 'مجری', field: 'responsible', align: 'right' },
      { name: 'progress', label: 'پیشرفت', field: 'progress', align: 'right', sortable: true },
      { name: 'status', label: 'وضعیت', field: 'status', align: 'right' }
    ]

    // ستون‌های جدول کاربرگ‌ها
    const formColumns = [
      { name: 'code', label: 'کد کاربرگ', field: 'code', align: 'right', sortable: true },
      { name: 'unit', label: 'واحد', field: row => row.unit?.name, align: 'right' },
      { name: 'target', label: 'هدف', field: row => row.target?.title, align: 'right' },
      { name: 'program', label: 'برنامه', field: row => row.program?.title, align: 'right' },
      { name: 'is_completed', label: 'وضعیت', field: 'is_completed', align: 'right', sortable: true },
      { name: 'created_at', label: 'تاریخ ایجاد', field: row => formatDate(row.created_at), align: 'right', sortable: true }
    ]

    // فرمت تاریخ
    const formatDate = (dateString) => {
      if (!dateString) return '—'
      const date = new Date(dateString)
      return date.toLocaleDateString('fa-IR')
    }

    // رنگ پیشرفت
    const getProgressColor = (progress) => {
      if (progress >= 80) return 'positive'
      if (progress >= 50) return 'warning'
      return 'grey'
    }

    // ساخت query params برای فیلتر بر اساس unit_id
    const getFilterParams = () => {
      if (isAdmin.value) {
        return {} // ادمین همه را می‌بیند
      }
      return { unit_id: userUnitId.value } // فقط واحد خودش
    }

    // بارگذاری آمار کلی
    const loadStats = async () => {
      try {
        const filterParams = getFilterParams()

        const targetsRes = await api.get('/targets', { params: { ...filterParams, per_page: 1 } })
        stats.value[0].value = targetsRes.data.pagination?.total || 0

        const programsRes = await api.get('/programs', { params: { ...filterParams, per_page: 100 } })
        const allPrograms = programsRes.data.data || []
        stats.value[1].value = allPrograms.filter(p => p.progress < 100).length

        const tasksRes = await api.get('/tasks', { params: { ...filterParams, per_page: 100 } })
        stats.value[2].value = tasksRes.data.data?.length || 0

        const activitiesRes = await api.get('/activities', { params: { ...filterParams, per_page: 100 } })
        const allActivities = activitiesRes.data.data || []
        stats.value[3].value = allActivities.filter(a => a.progress === 100).length

        const formsRes = await api.get('/forms', { params: { ...filterParams, per_page: 100 } })
        const allForms = formsRes.data.data || []
        stats.value[4].value = allForms.filter(f => f.is_completed === true).length
      } catch (error) {
        console.error('Load stats error:', error)
      }
    }

    // بارگذاری داده‌های نمودار (کاربرگ‌ها به تفکیک واحد)
    const loadChartData = async () => {
      if (chartLoading.value) return
      chartLoading.value = true

      try {
        const filterParams = getFilterParams()
        const response = await api.get('/forms', { params: { ...filterParams, per_page: 100 } })
        const forms = response.data.data || []

        // گروه‌بندی بر اساس واحد
        const formsByUnit = {}
        forms.forEach(form => {
          const unitName = form.unit?.name || 'سایر'
          if (!formsByUnit[unitName]) {
            formsByUnit[unitName] = { total: 0, completed: 0 }
          }
          formsByUnit[unitName].total++
          if (form.is_completed) {
            formsByUnit[unitName].completed++
          }
        })

        const labels = Object.keys(formsByUnit)
        const totalData = labels.map(l => formsByUnit[l].total)
        const completedData = labels.map(l => formsByUnit[l].completed)

        // رسم نمودار
        if (formsChart.value) {
          formsChart.value.destroy()
        }

        const ctx = document.getElementById('formsChart')?.getContext('2d')
        if (ctx) {
          formsChart.value = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [
                {
                  label: 'کل کاربرگ‌ها',
                  data: totalData,
                  backgroundColor: '#3b82f6',
                  borderRadius: 8,
                  barPercentage: 0.6,
                  categoryPercentage: 0.8
                },
                {
                  label: 'کاربرگ‌های تکمیل شده',
                  data: completedData,
                  backgroundColor: '#10b981',
                  borderRadius: 8,
                  barPercentage: 0.6,
                  categoryPercentage: 0.8
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  position: 'top',
                  labels: { font: { size: 12 } }
                },
                tooltip: { rtl: true }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: { display: true, text: 'تعداد کاربرگ‌ها', font: { size: 12 } }
                },
                x: {
                  title: { display: true, text: 'واحدها', font: { size: 12 } }
                }
              }
            }
          })
        }
      } catch (error) {
        console.error('Load chart data error:', error)
      } finally {
        chartLoading.value = false
      }
    }

    // بارگذاری آخرین فعالیت‌ها
    const loadRecentActivities = async () => {
      activitiesLoading.value = true
      try {
        const filterParams = getFilterParams()
        const response = await api.get('/activities', { params: { ...filterParams, per_page: 5 } })
        if (response.data.success) {
          recentActivities.value = response.data.data.map(a => ({
            ...a,
            status: a.progress === 100 ? 'انجام شده' : 'در حال اجرا'
          }))
        }
      } catch (error) {
        console.error('Load recent activities error:', error)
      } finally {
        activitiesLoading.value = false
      }
    }

    // بارگذاری آخرین کاربرگ‌ها
    const loadRecentForms = async () => {
      formsLoading.value = true
      try {
        const filterParams = getFilterParams()
        const response = await api.get('/forms', { params: { ...filterParams, per_page: 5 } })
        if (response.data.success) {
          recentForms.value = response.data.data || []
        }
      } catch (error) {
        console.error('Load recent forms error:', error)
      } finally {
        formsLoading.value = false
      }
    }

    // بارگذاری اطلاعات کاربر
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

    onMounted(() => {
      loadUserData()
      loadStats()
      loadChartData()
      loadRecentActivities()
      loadRecentForms()
    })

    return {
      userFullName,
      persianDate,
      stats,
      recentActivities,
      recentForms,
      activitiesLoading,
      formsLoading,
      activityColumns,
      formColumns,
      getProgressColor,
      formatDate
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

// ============================================================
// هدر خوش‌آمدگویی
// ============================================================
.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 32px;
  padding: 24px 28px;
  background: linear-gradient(135deg, #0d2318 0%, #1e5c3a 50%, #1a8a5e 100%);
  border-radius: 24px;
  color: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.welcome-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.welcome-subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
  line-height: 1.6;
}

.date-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(4px);
}

// ============================================================
// کارت‌های آماری
// ============================================================
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-bottom: 32px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 20px;
  border: 1px solid #eef2f6;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
  }
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.stat-title {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;

  .positive { color: #10b981; font-weight: 600; }
  .negative { color: #ef4444; font-weight: 600; }
  span:last-child { color: #94a3b8; }
}

// ============================================================
// نمودار
// ============================================================
.chart-card {
  background: #fff;
  border-radius: 20px;
  border: 1px solid #eef2f6;
  overflow: hidden;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #eef2f6;
  background: #fafcff;

  .header-title {
    display: flex;
    align-items: center;
    gap: 10px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
  }
}

.card-body {
  padding: 16px;
}

#formsChart {
  max-height: 140px !important;
}

.chart-body {
  padding: 12px !important;
  min-height: 160px;
}

// ============================================================
// کارت‌های جداول (تمام عرض)
// ============================================================
.recent-card {
  background: #fff;
  border-radius: 20px;
  border: 1px solid #eef2f6;
  overflow: hidden;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.recent-card.full-width {
  width: 100%;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 100px;

  .q-linear-progress {
    flex: 1;
    height: 8px;
    border-radius: 4px;
  }

  .progress-text {
    font-size: 11px;
    color: #64748b;
    min-width: 35px;
  }
}

.code-chip {
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-family: monospace;
  color: #0f172a;
}
</style>
