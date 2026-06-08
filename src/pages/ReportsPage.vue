<!-- src/pages/ReportsPage.vue -->
<template>
  <div class="page-root">

    <PageHeader title="گزارش‌گیری" subtitle="گزارش‌های پیشرفته از برنامه‌های عملیاتی و خروجی Excel" icon="insert_chart">
      <q-btn unelevated color="primary" icon="download" label="خروجی Excel" @click="exportExcel" />
      <q-btn unelevated color="secondary" icon="print" label="چاپ" @click="printReport" class="q-mr-sm" />
    </PageHeader>

    <!-- فیلترها -->
    <div class="filter-card">
      <div class="filter-card-title">
        <q-icon name="filter_alt" size="18px" class="q-ml-sm" />
        فیلترهای گزارش
      </div>
      <div class="filter-grid">
        <div class="form-group">
          <label>نوع گزارش</label>
          <q-select v-model="reportType" outlined dense :options="reportTypes" />
        </div>
        <div class="form-group">
          <label>سال</label>
          <q-select v-model="yearFilter" outlined dense :options="['1403','1404','1405']" clearable />
        </div>
        <div class="form-group">
          <label>واحد</label>
          <q-select v-model="unitFilter" outlined dense :options="unitOpts" clearable />
        </div>
        <div class="form-group">
          <label>وضعیت</label>
          <q-select v-model="statusFilter" outlined dense :options="['در حال اجرا','اتمام یافته','متوقف شده']" clearable />
        </div>
      </div>
      <div class="filter-actions">
        <q-btn unelevated color="primary" icon="search" label="ایجاد گزارش" @click="generate" />
        <q-btn flat icon="refresh" label="پاک کردن فیلترها" @click="clearFilters" />
      </div>
    </div>

    <!-- کارت‌های خلاصه -->
    <div class="summary-grid">
      <div class="summary-card" v-for="s in summaryCards" :key="s.label">
        <div class="summary-icon" :style="{ background: s.bg }">
          <q-icon :name="s.icon" size="20px" :style="{ color: s.color }" />
        </div>
        <div class="summary-body">
          <span class="summary-label">{{ s.label }}</span>
          <span class="summary-value">{{ s.value }}</span>
        </div>
        <div class="summary-trend" :class="s.up ? 'trend-up' : 'trend-neutral'">
          <q-icon :name="s.up ? 'trending_up' : 'remove'" size="12px" />
          {{ s.trend }}
        </div>
      </div>
    </div>

    <!-- نمودارها -->
    <div class="charts-row">
      <div class="chart-card chart-card--wide">
        <div class="card-head">
          <div>
            <h3 class="card-title">پیشرفت برنامه‌ها بر اساس واحد</h3>
            <p class="card-sub">مقایسه درصد پیشرفت در واحدهای مختلف</p>
          </div>
        </div>
        <div class="chart-wrap">
          <canvas ref="barChart"></canvas>
        </div>
      </div>
      <div class="chart-card chart-card--narrow">
        <div class="card-head">
          <div>
            <h3 class="card-title">توزیع وضعیت</h3>
            <p class="card-sub">فعالیت‌ها بر اساس وضعیت</p>
          </div>
        </div>
        <div class="donut-wrap">
          <canvas ref="donutChart"></canvas>
        </div>
        <div class="donut-legend">
          <div class="donut-legend-item" v-for="d in donutData" :key="d.label">
            <span class="donut-dot" :style="{ background: d.color }"></span>
            <span class="donut-label">{{ d.label }}</span>
            <span class="donut-val">{{ d.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- جدول تفصیلی -->
    <div class="table-card">
      <div class="table-head-bar">
        <div>
          <h3 class="card-title">گزارش تفصیلی</h3>
          <p class="card-sub">جزئیات برنامه‌ها، اقدامات و فعالیت‌ها</p>
        </div>
        <div class="tab-btns">
          <button
            v-for="t in tabs" :key="t.key"
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === t.key }"
            @click="activeTab = t.key"
          >{{ t.label }}</button>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th v-for="col in currentCols" :key="col.key">{{ col.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in currentData" :key="i">
            <td v-for="col in currentCols" :key="col.key">
              <template v-if="col.key === 'progress'">
                <div class="prog-wrap">
                  <div class="prog-track"><div class="prog-fill" :style="{ width: row[col.key] + '%' }"></div></div>
                  <span class="prog-text">{{ row[col.key] }}%</span>
                </div>
              </template>
              <template v-else-if="col.key === 'status'">
                <span class="status-badge" :class="statusClass(row[col.key])">{{ row[col.key] }}</span>
              </template>
              <template v-else-if="col.key === 'isCompleted'">
                <span class="status-badge" :class="row[col.key] ? 'badge-active' : 'badge-pending'">
                  {{ row[col.key] ? 'انجام شده' : 'انجام نشده' }}
                </span>
              </template>
              <template v-else>{{ row[col.key] || '—' }}</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import Chart from 'chart.js/auto'
import PageHeader from 'components/PageHeader.vue'

export default {
  components: { PageHeader },
  setup () {
    const $q = useQuasar()
    const barChart   = ref(null)
    const donutChart = ref(null)
    const reportType  = ref('گزارش پیشرفت')
    const yearFilter  = ref('1404')
    const unitFilter  = ref(null)
    const statusFilter = ref(null)
    const activeTab   = ref('targets')

    const reportTypes = ['گزارش پیشرفت','گزارش عملکرد','گزارش مالی','گزارش کامل']
    const unitOpts = ['واحد مالی','واحد فنی','واحد بازرگانی','واحد منابع انسانی','واحد حقوقی']

    const summaryCards = [
      { label:'کل اهداف',          value:5,  icon:'track_changes',  bg:'#ecfdf5', color:'#1e8a5e', trend:'+2',  up:true  },
      { label:'برنامه‌های فعال',   value:8,  icon:'event_note',     bg:'#eff6ff', color:'#3b82f6', trend:'+3',  up:true  },
      { label:'اقدامات در اجرا',   value:15, icon:'checklist_rtl',  bg:'#fff7ed', color:'#f59e0b', trend:'+5',  up:true  },
      { label:'فعالیت انجام‌شده',  value:42, icon:'task_alt',       bg:'#f0fdf4', color:'#16a34a', trend:'68%', up:true  },
    ]

    const donutData = [
      { label:'انجام شده',    color:'#1e8a5e', value:42 },
      { label:'در حال انجام', color:'#3b82f6', value:25 },
      { label:'انجام نشده',   color:'#e2e8f0', value:23 },
    ]

    const tabs = [
      { key:'targets',    label:'اهداف'     },
      { key:'programs',   label:'برنامه‌ها'  },
      { key:'tasks',      label:'اقدامات'   },
      { key:'activities', label:'فعالیت‌ها' },
    ]

    const tabData = {
      targets: {
        cols: [
          { key:'code', label:'کد' }, { key:'title', label:'عنوان هدف' },
          { key:'year', label:'سال' }, { key:'progress', label:'پیشرفت' },
          { key:'programCount', label:'برنامه‌ها' },
        ],
        rows: [
          { code:'T-001', title:'بهبود فرآیندهای اداری',             year:'1404', progress:75, programCount:3 },
          { code:'T-002', title:'افزایش بهره‌وری نیروی انسانی',      year:'1404', progress:45, programCount:2 },
          { code:'T-003', title:'توسعه زیرساخت‌های فناوری اطلاعات', year:'1404', progress:60, programCount:4 },
        ]
      },
      programs: {
        cols: [
          { key:'code', label:'کد' }, { key:'title', label:'عنوان برنامه' },
          { key:'target', label:'هدف' }, { key:'progress', label:'پیشرفت' },
          { key:'budget', label:'بودجه (م.ر)' }, { key:'taskCount', label:'اقدامات' },
        ],
        rows: [
          { code:'P-001', title:'برنامه آموزش کارکنان',    target:'T-002', progress:80, budget:500,  taskCount:5 },
          { code:'P-002', title:'برنامه ارزیابی عملکرد',   target:'T-002', progress:60, budget:300,  taskCount:4 },
          { code:'P-003', title:'برنامه بهینه‌سازی فرآیند',target:'T-001', progress:90, budget:800,  taskCount:6 },
        ]
      },
      tasks: {
        cols: [
          { key:'code', label:'کد' }, { key:'title', label:'عنوان اقدام' },
          { key:'program', label:'برنامه' }, { key:'progress', label:'پیشرفت' },
          { key:'responsible', label:'مسئول' }, { key:'activityCount', label:'فعالیت‌ها' },
        ],
        rows: [
          { code:'TASK-001', title:'تهیه محتوای آموزشی',    program:'P-001', progress:100, responsible:'مریم محمدی', activityCount:3 },
          { code:'TASK-002', title:'برگزاری دوره‌های آموزشی',program:'P-001', progress:80,  responsible:'مریم محمدی', activityCount:5 },
          { code:'TASK-003', title:'ارزیابی اثربخشی',        program:'P-001', progress:60,  responsible:'محمد جعفری', activityCount:2 },
        ]
      },
      activities: {
        cols: [
          { key:'code', label:'کد' }, { key:'title', label:'عنوان فعالیت' },
          { key:'task', label:'اقدام' }, { key:'isCompleted', label:'وضعیت' },
          { key:'dueDate', label:'مهلت' }, { key:'priority', label:'اولویت' },
        ],
        rows: [
          { code:'ACT-001', title:'تهیه سرفصل‌های آموزشی',    task:'TASK-001', isCompleted:true,  dueDate:'1404/03/15', priority:'بالا'  },
          { code:'ACT-002', title:'تهیه محتوای دوره مقدماتی', task:'TASK-001', isCompleted:true,  dueDate:'1404/03/30', priority:'بالا'  },
          { code:'ACT-003', title:'تهیه محتوای دوره پیشرفته', task:'TASK-001', isCompleted:false, dueDate:'1404/04/15', priority:'متوسط' },
        ]
      }
    }

    const currentCols = computed(() => tabData[activeTab.value].cols)
    const currentData = computed(() => tabData[activeTab.value].rows)

    const statusClass = (s) => ({ 'در حال اجرا':'badge-progress', 'نزدیک به اتمام':'badge-done', 'اتمام یافته':'badge-active', 'متوقف شده':'badge-inactive' }[s] || 'badge-neutral')

    const generate = () => $q.notify({ type:'positive', message:'گزارش با موفقیت ایجاد شد', position:'top' })
    const clearFilters = () => { yearFilter.value = null; unitFilter.value = null; statusFilter.value = null }
    const exportExcel = () => $q.notify({ type:'info', message:'در حال آماده‌سازی فایل Excel...', position:'top' })
    const printReport = () => window.print()

    onMounted(() => {
      new Chart(barChart.value, {
        type: 'bar',
        data: {
          labels: ['واحد مالی','واحد فنی','واحد بازرگانی','منابع انسانی','واحد حقوقی','واحد آموزش'],
          datasets: [{
            label: 'درصد پیشرفت',
            data: [75, 45, 85, 60, 30, 70],
            backgroundColor: (ctx) => {
              const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260)
              g.addColorStop(0, '#1e8a5e'); g.addColorStop(1, '#4caf87'); return g
            },
            borderRadius: 6, borderSkipped: false,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero:true, max:100, grid:{ color:'#f1f5f9' }, ticks:{ font:{ family:'Vazirmatn', size:11 }, color:'#94a3b8', callback: v => v+'%' } },
            x: { grid:{ display:false }, ticks:{ font:{ family:'Vazirmatn', size:11 }, color:'#64748b' } }
          }
        }
      })

      new Chart(donutChart.value, {
        type: 'doughnut',
        data: {
          labels: ['انجام شده','در حال انجام','انجام نشده'],
          datasets: [{ data:[42,25,23], backgroundColor:['#1e8a5e','#3b82f6','#e2e8f0'], borderWidth:0, hoverOffset:4 }]
        },
        options: { responsive:true, maintainAspectRatio:false, cutout:'72%', plugins:{ legend:{ display:false } } }
      })
    })

    return { barChart, donutChart, reportType, yearFilter, unitFilter, statusFilter, activeTab, reportTypes, unitOpts, summaryCards, donutData, tabs, currentCols, currentData, statusClass, generate, clearFilters, exportExcel, printReport }
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
.filter-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; }
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
.summary-trend { font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 5px; white-space: nowrap; display: flex; align-items: center; gap: 2px; }
.trend-up      { background: #ecfdf5; color: #16a34a; }
.trend-neutral { background: #f1f5f9; color: #94a3b8; }

.charts-row { display: grid; grid-template-columns: 1fr 300px; gap: 16px; margin-bottom: 20px; }
.chart-card { background: #fff; border: 1.5px solid #c6e8d8; border-radius: 14px; padding: 20px; }
.card-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
.card-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
.card-sub   { font-size: 12px; color: #94a3b8; }
.chart-wrap { height: 220px; position: relative; }
.donut-wrap { height: 160px; position: relative; margin-bottom: 14px; }
.donut-legend { display: flex; flex-direction: column; gap: 7px; }
.donut-legend-item { display: flex; align-items: center; gap: 7px; font-size: 12px; }
.donut-dot   { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.donut-label { flex: 1; color: #475569; }
.donut-val   { font-weight: 700; color: #0f172a; }

.table-card { background: #fff; border: 1.5px solid #c6e8d8; border-radius: 14px; overflow: hidden; }
.table-head-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
.tab-btns { display: flex; gap: 4px; }
.tab-btn {
  padding: 6px 14px; border-radius: 8px; border: 1px solid #e2e8f0;
  background: #fff; font-size: 12.5px; font-weight: 500; color: #64748b;
  cursor: pointer; font-family: 'Vazirmatn', sans-serif;
  transition: all .15s;
  &:hover { background: #f8fafc; }
  &--active { background: #1e8a5e !important; color: #fff !important; border-color: #1e8a5e !important; }
}

@media (max-width: 1100px) {
  .filter-grid { grid-template-columns: repeat(2, 1fr); }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .summary-grid { grid-template-columns: 1fr; }
  .filter-grid { grid-template-columns: 1fr; }
}
</style>
