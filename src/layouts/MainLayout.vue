<!-- src/layouts/MainLayout.vue -->
<template>
  <q-layout view="hHh Lpr lFf" class="app-layout">

    <!-- هدر -->
    <q-header elevated class="app-header">
      <div class="header-inner">
        <div class="header-start">
          <button class="menu-toggle" @click="toggleDrawer">
            <q-icon :name="drawerOpen ? 'menu_open' : 'menu'" size="22px" />
          </button>
          <div class="page-breadcrumb">
            <span class="breadcrumb-app">سیب</span>
            <q-icon name="chevron_left" size="16px" class="breadcrumb-sep" />
            <span class="breadcrumb-page">{{ currentPageTitle }}</span>
          </div>
        </div>
        <div class="header-center">
          <h1 class="app-title">سامانه یکپارچه برنامه عملیاتی</h1>
        </div>
        <div class="header-end">
          <q-btn-dropdown
            flat
            dense
            no-caps
            class="profile-btn-dropdown"
            :label="userFullName"
          >
            <template v-slot:label>
              <div class="profile-chip" style="background: #f0faf6">
                <div class="profile-info">
                  <span class="profile-name">{{ userFullName }}</span>
                  <span class="profile-role">{{ userRole }}</span>
                </div>
                <q-icon name="expand_more" size="16px" class="profile-arrow" />
              </div>
            </template>

            <div class="profile-dropdown">
              <div class="dropdown-header">
                <div>
                  <div class="dropdown-name">{{ userFullName }}</div>
                  <div class="dropdown-email">{{ userEmail }}</div>
                </div>
              </div>
              <q-separator class="q-my-sm" />
              <q-item clickable dense class="dropdown-item" @click="navigate('/profile')">
                <q-item-section avatar><q-icon name="person_outline" size="18px" /></q-item-section>
                <q-item-section>پروفایل من</q-item-section>
              </q-item>
              <q-separator class="q-my-sm" />
              <q-item clickable dense class="dropdown-item dropdown-logout" @click="logout">
                <q-item-section avatar><q-icon name="logout" size="18px" /></q-item-section>
                <q-item-section>خروج از سیستم</q-item-section>
              </q-item>
            </div>
          </q-btn-dropdown>
        </div>
      </div>
    </q-header>

    <!-- سایدبار سمت راست -->
    <div class="custom-drawer" :class="{ 'custom-drawer--open': drawerOpen }">
      <div class="custom-drawer-inner">
        <div class="sidebar-brand">
          <div class="sidebar-logo"><span>سـیـب</span></div>
        </div>

        <div class="sidebar-sep"></div>

        <nav class="sidebar-nav">
          <template v-for="(item, idx) in menuItems" :key="item.to">
            <!-- منوهای معمولی -->
            <template v-if="item.type === 'link'">
              <div
                class="nav-item"
                :class="{ 'nav-item--active': isActive(item.to) }"
                @click="navigate(item.to)"
              >
                <div class="nav-icon">
                  <q-icon :name="item.icon" size="17px" />
                </div>
                <span class="nav-label">{{ item.title }}</span>
              </div>
              <div v-if="idx < menuItems.length - 1" class="nav-divider"></div>
            </template>

            <!-- منوی درختی اهداف -->
            <template v-if="item.type === 'tree'">
              <div
                class="nav-item nav-item--tree"
                :class="{ 'nav-item--active': isActive(item.to) }"
                @click="navigate(item.to)"
              >
                <div class="nav-icon">
                  <q-icon :name="item.icon" size="17px" />
                </div>
                <span class="nav-label">{{ item.title }}</span>
              </div>

              <!-- ساختار درختی اهداف -->
              <div class="tree-structure">
                <!-- پیام در صورت نبود هدف -->
                <div v-if="targets.length === 0" class="tree-empty">
                  <span>هیچ هدفی یافت نشد</span>
                </div>

                <!-- اهداف - همیشه نمایش داده می‌شوند -->
                <div v-for="target in targets" :key="`target-${target.id}`" class="tree-level-1">
                  <div 
                    class="tree-item"
                    :class="{ 'tree-item--selected': selectedTargetId === target.id }"
                    @click.stop="navigateToTarget(target)"
                  >
                    <q-icon 
                      v-if="getProgramsByTarget(target.id).length > 0"
                      :name="expandedTargets[target.id] ? 'expand_more' : 'chevron_left'" 
                      size="14px" 
                      class="tree-expand-icon"
                      @click.stop="toggleTarget(target.id)"
                    />
                    <span v-else class="tree-expand-spacer"></span>
                    <q-icon name="flag" size="14px" class="tree-item-icon" />
                    <span class="tree-item-label">{{ target.title }}</span>
                  </div>

                  <!-- برنامه‌ها - فقط وقتی expand شده نمایش داده می‌شوند -->
                  <template v-if="expandedTargets[target.id]">
                    <div 
                      v-for="program in getProgramsByTarget(target.id)" 
                      :key="`program-${program.id}`"
                      class="tree-level-2"
                    >
                      <div 
                        class="tree-item"
                        :class="{ 'tree-item--selected': selectedProgramId === program.id }"
                        @click.stop="navigateToProgram(program, target)"
                      >
                        <q-icon 
                          v-if="getTasksByProgram(program.id).length > 0"
                          :name="expandedPrograms[program.id] ? 'expand_more' : 'chevron_left'" 
                          size="14px" 
                          class="tree-expand-icon"
                          @click.stop="toggleProgram(program.id)"
                        />
                        <span v-else class="tree-expand-spacer"></span>
                        <q-icon name="event_note" size="14px" class="tree-item-icon" />
                        <span class="tree-item-label">{{ program.title }}</span>
                      </div>

                      <!-- اقدامات - فقط وقتی expand شده نمایش داده می‌شوند -->
                      <template v-if="expandedPrograms[program.id]">
                        <div 
                          v-for="task in getTasksByProgram(program.id)" 
                          :key="`task-${task.id}`"
                          class="tree-level-3"
                        >
                          <div 
                            class="tree-item"
                            :class="{ 'tree-item--selected': selectedTaskId === task.id }"
                            @click.stop="navigateToTask(task, program, target)"
                          >
                            <q-icon 
                              v-if="getActivitiesByTask(task.id).length > 0"
                              :name="expandedTasks[task.id] ? 'expand_more' : 'chevron_left'" 
                              size="14px" 
                              class="tree-expand-icon"
                              @click.stop="toggleTask(task.id)"
                            />
                            <span v-else class="tree-expand-spacer"></span>
                            <q-icon name="checklist_rtl" size="14px" class="tree-item-icon" />
                            <span class="tree-item-label">{{ task.title }}</span>
                          </div>

                          <!-- فعالیت‌ها - فقط وقتی expand شده نمایش داده می‌شوند -->
                          <template v-if="expandedTasks[task.id]">
                            <div 
                              v-for="activity in getActivitiesByTask(task.id)" 
                              :key="`activity-${activity.id}`"
                              class="tree-level-4"
                            >
                              <div 
                                class="tree-item tree-item--leaf"
                                :class="{ 'tree-item--selected': selectedActivityId === activity.id }"
                                @click.stop="navigateToActivity(activity)"
                              >
                                <span class="tree-expand-spacer"></span>
                                <q-icon name="article" size="14px" class="tree-item-icon" />
                                <span class="tree-item-label">{{ activity.title }}</span>
                              </div>
                            </div>
                          </template>
                        </div>
                      </template>
                    </div>
                  </template>
                </div>
              </div>

              <div v-if="idx < menuItems.length - 1" class="nav-divider"></div>
            </template>
          </template>
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-sep"></div>
          <div class="nav-item nav-item--logout" @click="logout">
            <div class="nav-icon"><q-icon name="logout" size="17px" /></div>
            <span class="nav-label">خروج از سیستم</span>
          </div>
        </div>
      </div>
    </div>

    <!-- محتوای اصلی -->
    <q-page-container :style="{ marginRight: drawerOpen ? '260px' : '0' }">
      <q-page class="app-page">
        <router-view />
      </q-page>
    </q-page-container>

  </q-layout>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

export default {
  setup () {
    const $q = useQuasar()
    const router = useRouter()
    const route = useRoute()
    const drawerOpen = ref(true)

    // اطلاعات کاربر از localStorage
    const userData = ref(null)

    // داده‌های درختی
    const targets = ref([])
    const programs = ref([])
    const tasks = ref([])
    const activities = ref([])
    const expandedTargets = ref({})
    const expandedPrograms = ref({})
    const expandedTasks = ref({})

    // آیتم‌های انتخاب شده برای هایلایت
    const selectedTargetId = ref(null)
    const selectedProgramId = ref(null)
    const selectedTaskId = ref(null)
    const selectedActivityId = ref(null)

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

    const loadTreeData = async () => {
      try {
        console.log('Loading tree data...')
        
        // ابتدا activities را لود می‌کنیم (فیلتر در backend بر اساس واحد کاربر از طریق activity_unit انجام می‌شود)
        const activitiesRes = await api.get('/activities', { params: { per_page: 1000 } })
        activities.value = activitiesRes.data.data || []
        
        console.log('Activities loaded:', activities.value.length)

        if (activities.value.length === 0) {
          // اگر فعالیتی نیست، هیچ چیز نمایش نمی‌دهیم
          targets.value = []
          programs.value = []
          tasks.value = []
          return
        }

        // استخراج task_id های منحصر به فرد از activities
        const taskIds = [...new Set(activities.value.map(a => a.task_id).filter(id => id))]
        console.log('Task IDs from activities:', taskIds)

        if (taskIds.length === 0) {
          targets.value = []
          programs.value = []
          tasks.value = []
          return
        }

        // دریافت تمام tasks (بدون فیلتر backend)
        const tasksRes = await api.get('/tasks', { params: { per_page: 1000, no_filter: true } })
        const allTasks = tasksRes.data.data || []
        
        // فیلتر tasks بر اساس taskIds
        tasks.value = allTasks.filter(t => taskIds.includes(t.id))
        console.log('Filtered tasks:', tasks.value.length)

        if (tasks.value.length === 0) {
          targets.value = []
          programs.value = []
          return
        }

        // استخراج program_id های منحصر به فرد از tasks
        const programIds = [...new Set(tasks.value.map(t => t.program_id).filter(id => id))]
        console.log('Program IDs from tasks:', programIds)

        if (programIds.length === 0) {
          targets.value = []
          programs.value = []
          return
        }

        // دریافت تمام programs (بدون فیلتر backend)
        const programsRes = await api.get('/programs', { params: { per_page: 1000, no_filter: true } })
        const allPrograms = programsRes.data.data || []
        
        // فیلتر programs بر اساس programIds
        programs.value = allPrograms.filter(p => programIds.includes(p.id))
        console.log('Filtered programs:', programs.value.length)

        if (programs.value.length === 0) {
          targets.value = []
          return
        }

        // استخراج target_id های منحصر به فرد از programs
        const targetIds = [...new Set(programs.value.map(p => p.target_id).filter(id => id))]
        console.log('Target IDs from programs:', targetIds)

        if (targetIds.length === 0) {
          targets.value = []
          return
        }

        // دریافت تمام targets (بدون فیلتر backend)
        const targetsRes = await api.get('/targets', { params: { per_page: 1000, no_filter: true } })
        const allTargets = targetsRes.data.data || []
        
        console.log('All targets from API:', allTargets.length, allTargets)
        console.log('Looking for target IDs:', targetIds)
        
        // فیلتر targets بر اساس targetIds
        targets.value = allTargets.filter(t => targetIds.includes(t.id))
        console.log('Filtered targets:', targets.value.length, targets.value)

        console.log('Tree data loaded successfully')
        console.log('Final counts - Targets:', targets.value.length, 'Programs:', programs.value.length, 'Tasks:', tasks.value.length, 'Activities:', activities.value.length)
      } catch (error) {
        console.error('Load tree data error:', error)
        console.error('Error response:', error.response?.data)
        console.error('Error status:', error.response?.status)
        targets.value = []
        programs.value = []
        tasks.value = []
        activities.value = []
      }
    }

    onMounted(() => {
      loadUserData()
      loadTreeData()
    })

    const toggleDrawer = () => {
      drawerOpen.value = !drawerOpen.value
    }

    const userRoleCode = computed(() => {
      if (userData.value && userData.value.role) {
        return userData.value.role.code
      }
      return null
    })

    const isAdmin = computed(() => userRoleCode.value === 'ADMIN')
    const isUnitUser = computed(() => userRoleCode.value === 'UNIT_USER')
    const userUnitId = computed(() => userData.value?.unit_id)

    const getFilterParams = () => {
      if (isAdmin.value) return {}
      if (isUnitUser.value) return {} // UNIT_USER فیلتر در backend بر اساس واحد (activity_unit) انجام می‌شود
      return { unit_id: userUnitId.value }
    }

    const getProgramsByTarget = (targetId) => {
      return programs.value.filter(p => p.target_id === targetId)
    }

    const getTasksByProgram = (programId) => {
      return tasks.value.filter(t => t.program_id === programId)
    }

    const getActivitiesByTask = (taskId) => {
      return activities.value.filter(a => a.task_id === taskId)
    }

    const toggleTarget = (targetId) => {
      expandedTargets.value[targetId] = !expandedTargets.value[targetId]
    }

    const toggleProgram = (programId) => {
      expandedPrograms.value[programId] = !expandedPrograms.value[programId]
    }

    const toggleTask = (taskId) => {
      expandedTasks.value[taskId] = !expandedTasks.value[taskId]
    }

    const navigateToTarget = (target) => {
      selectedTargetId.value = target.id
      selectedProgramId.value = null
      selectedTaskId.value = null
      selectedActivityId.value = null
      router.push(`/targets?target_id=${target.id}`)
    }

    const navigateToProgram = (program, target) => {
      selectedTargetId.value = target.id
      selectedProgramId.value = program.id
      selectedTaskId.value = null
      selectedActivityId.value = null
      router.push(`/targets?target_id=${target.id}&program_id=${program.id}`)
    }

    const navigateToTask = (task, program, target) => {
      selectedTargetId.value = target.id
      selectedProgramId.value = program.id
      selectedTaskId.value = task.id
      selectedActivityId.value = null
      router.push(`/targets?target_id=${target.id}&program_id=${program.id}&task_id=${task.id}`)
    }

    const navigateToActivity = (activity) => {
      selectedActivityId.value = activity.id
      // اگر کاربرگ دارد، به صفحه فرم برو
      if (activity.form_code) {
        router.push('/forms')
      }
    }

    // لیست کامل منوها با تعیین نقش‌های مجاز
    const allMenuItems = [
      { title: 'داشبورد',            icon: 'dashboard',       to: '/dashboard',  roles: ['ADMIN', 'UNIT_USER'], type: 'link' },
      { title: 'واحدها',             icon: 'corporate_fare',  to: '/units',      roles: ['ADMIN'], type: 'link' },
      { title: 'نقش‌ها',             icon: 'manage_accounts', to: '/roles',      roles: ['ADMIN'], type: 'link' },
      { title: 'کاربران',            icon: 'group',           to: '/users',      roles: ['ADMIN'], type: 'link' },
      { title: 'اهداف',              icon: 'track_changes',   to: '/targets',    roles: ['ADMIN', 'UNIT_USER'], type: 'tree' },
      { title: 'مدیریت کاربرگ‌ها',   icon: 'description',     to: '/forms',      roles: ['ADMIN', 'UNIT_USER'], type: 'link' },
      { title: 'گزارش‌ها',           icon: 'insert_chart',    to: '/reports',    roles: ['ADMIN', 'UNIT_USER'], type: 'link' },
    ]

    const menuItems = computed(() => {
      if (!userRoleCode.value) {
        return allMenuItems.filter(item => item.roles.includes('ADMIN'))
      }
      return allMenuItems.filter(item => item.roles.includes(userRoleCode.value))
    })

    const pageTitles = {
      '/dashboard':  'داشبورد',
      '/units':      'مدیریت واحدها',
      '/roles':      'مدیریت نقش‌ها',
      '/users':      'مدیریت کاربران',
      '/targets':    'مدیریت اهداف',
      '/forms':      'مدیریت کاربرگ‌ها',
      '/reports':    'گزارش‌گیری',
    }

    const currentPageTitle = computed(() => pageTitles[route.path] || 'سامانه سیب')
    const isActive = (path) => route.path === path
    const navigate = (path) => router.push(path)

    const userFullName = computed(() => {
      if (userData.value) {
        return `${userData.value.first_name || ''} ${userData.value.last_name || ''}`.trim() || 'کاربر'
      }
      return 'کاربر'
    })

    const userInitial = computed(() => {
      if (userData.value && userData.value.first_name) {
        return userData.value.first_name.charAt(0)
      }
      return 'ک'
    })

    const userRoleName = computed(() => {
      if (userData.value && userData.value.role) {
        return userData.value.role.name || 'کاربر'
      }
      return 'کاربر'
    })

    const userEmail = computed(() => {
      if (userData.value && userData.value.email) {
        return userData.value.email
      }
      return 'user@sib.ir'
    })

    const logout = () => {
      $q.dialog({
        title: 'خروج از سیستم',
        message: 'آیا مطمئن هستید که می‌خواهید خارج شوید؟',
        cancel: { label: 'انصراف', flat: true, color: 'grey' },
        ok: { label: 'خروج', color: 'negative', unelevated: true },
        persistent: true
      }).onOk(async () => {
        $q.loading.show({
          message: 'در حال خروج...',
          backgroundColor: 'primary',
        })

        try {
          const token = localStorage.getItem('auth_token')
          if (token) {
            await api.post('/logout', {}, {
              headers: { Authorization: `Bearer ${token}` }
            })
          }
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          delete api.defaults.headers.common['Authorization']
          $q.loading.hide()
          $q.notify({
            type: 'positive',
            message: 'خروج با موفقیت انجام شد',
            position: 'top',
            timeout: 1500
          })
          await router.replace('/login')
          window.location.href = '/login'
        }
      })
    }

    return {
      drawerOpen,
      menuItems,
      currentPageTitle,
      isActive,
      navigate,
      logout,
      toggleDrawer,
      userFullName,
      userInitial,
      userRole: userRoleName,
      userEmail,
      targets,
      programs,
      tasks,
      activities,
      expandedTargets,
      expandedPrograms,
      expandedTasks,
      selectedTargetId,
      selectedProgramId,
      selectedTaskId,
      selectedActivityId,
      getProgramsByTarget,
      getTasksByProgram,
      getActivitiesByTask,
      toggleTarget,
      toggleProgram,
      toggleTask,
      navigateToTarget,
      navigateToProgram,
      navigateToTask,
      navigateToActivity
    }
  }
}
</script>

<style lang="scss" scoped>
.app-layout {
  background: #f1f5f9;
  min-height: 100vh;
}

// ─── هدر ──────────────────────────────────────────────────────────────────────
.app-header {
  background: #fff !important;
  border-bottom: 1px solid #d1e8df !important;
  box-shadow: 0 1px 6px rgba(30,138,94,.08) !important;
  height: 60px !important;
  position: fixed !important;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.header-inner {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  direction: rtl;
}

.header-start { display: flex; align-items: center; gap: 10px; flex: 1; }
.header-center { display: flex; align-items: center; justify-content: center; flex: 1; }
.header-end   { display: flex; align-items: center; gap: 4px; flex: 1; justify-content: flex-end; }

.app-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  background: linear-gradient(135deg, #1e8a5e, #4caf87);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 8px rgba(30,138,94,.1);
  letter-spacing: -0.3px;
}

.menu-toggle {
  width: 34px; height: 34px;
  border: none; background: transparent; cursor: pointer;
  border-radius: 8px; color: #475569;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s;
  &:hover { background: #f0faf6; color: #1e8a5e; }
}

.page-breadcrumb {
  display: flex; align-items: center; gap: 4px; font-size: 13px;
}
.breadcrumb-app  { color: #94a3b8; font-weight: 500; }
.breadcrumb-sep  { color: #cbd5e1; }
.breadcrumb-page { color: #1e293b; font-weight: 700; }

.profile-btn-dropdown {
  padding: 0 !important;
  min-height: auto !important;
  .q-btn__content { padding: 0; }
}

.profile-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background .15s;
  &:hover { background: #f0faf6; }
}

.profile-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e8a5e, #166b49);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-info {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  text-align: right;
}
.profile-name { font-size: 12.5px; font-weight: 700; color: #1e293b; }
.profile-role { font-size: 10.5px; color: #94a3b8; }
.profile-arrow { color: #94a3b8; }

.profile-dropdown {
  width: 210px;
  padding: 10px;
  font-family: 'Vazirmatn', sans-serif;
  direction: rtl;
}
.dropdown-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 4px 10px;
  direction: rtl;
}
.dropdown-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e8a5e, #166b49);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dropdown-name { font-size: 13px; font-weight: 700; color: #1e293b; }
.dropdown-email { font-size: 11px; color: #94a3b8; direction: ltr; }
.dropdown-item {
  border-radius: 8px !important;
  font-size: 13px !important;
  color: #334155 !important;
  direction: rtl;
}
.dropdown-logout { color: #ef4444 !important; }

// ─── سایدبار ────────────────────────────────────────────────────────────────────
.custom-drawer {
  position: fixed;
  top: 60px;
  right: 0;
  width: 260px;
  height: calc(100vh - 60px);
  background: #0d2318;
  transform: translateX(0);
  transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  z-index: 999;
  border-left: 2px solid #1e8a5e;
  box-shadow: -4px 0 20px rgba(0,0,0,.25);

  &--open { transform: translateX(0); }
  &:not(.custom-drawer--open) { transform: translateX(100%); }
}

.custom-drawer-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  direction: rtl;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 14px 14px;
  flex-shrink: 0;
}
.sidebar-logo {
  width: 230px;
  height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, #1e8a5e, #4caf87);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 3px 8px rgba(30,138,94,.4);
  span { font-size: 25px; font-weight: 800; color: #fff; }
}

.sidebar-sep {
  height: 1px;
  background: rgba(255,255,255,.08);
  margin: 0 12px;
  flex-shrink: 0;
}

.sidebar-nav {
  padding: 8px 8px 0;
  flex: 1;
  overflow-y: auto;
}
.nav-divider {
  height: 1px;
  background: rgba(255,255,255,.06);
  margin: 1px 8px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 9px;
  border-radius: 8px;
  cursor: pointer;
  transition: all .15s ease;
  position: relative;
  color: #5a9e82;
  &:hover { background: rgba(255,255,255,.07); color: #a8d5be; }
  &--active {
    background: rgba(30,138,94,.2) !important;
    color: #ffffff !important;
    .nav-icon { background: rgba(76,175,135,.22) !important; color: #4caf87 !important; }
    &::after {
      content: '';
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 18px;
      background: #4caf87;
      border-radius: 0 3px 3px 0;
    }
  }
  &--tree {
    margin-bottom: 4px;
  }
}
.nav-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(255,255,255,.05);
  color: #5a9e82;
  transition: background .15s, color .15s;
  .nav-item:hover & { background: rgba(255,255,255,.09); color: #a8d5be; }
}
.nav-label {
  font-size: 12.5px;
  font-weight: 600;
  flex: 1;
}

// ساختار درختی
.tree-structure {
  margin: 0 4px 8px 4px;
  padding: 6px 0;
  background: rgba(0,0,0,.15);
  border-radius: 8px;
  border: 1px solid rgba(76,175,135,.15);
}

.tree-empty {
  padding: 12px 16px;
  text-align: center;
  color: #6fb392;
  font-size: 11px;
  font-style: italic;
}

.tree-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  cursor: pointer;
  transition: all .15s;
  color: #6fb392;
  font-size: 12px;
  border-radius: 6px;
  margin: 2px 0;
  
  &:hover {
    background: rgba(255,255,255,.08);
    color: #b8e4cb;
  }

  &--leaf {
    font-style: italic;
    opacity: 0.9;
  }

  &--selected {
    background: rgba(76,175,135,.25) !important;
    color: #fff !important;
    font-weight: 700;
    box-shadow: 0 2px 6px rgba(76,175,135,.2);
    
    .tree-item-icon {
      color: #4caf87 !important;
      background: rgba(76,175,135,.3);
      border-radius: 4px;
      padding: 2px;
    }
  }
}

.tree-expand-icon {
  color: #6fb392;
  flex-shrink: 0;
  transition: all .2s;
  cursor: pointer;
  
  &:hover {
    color: #4caf87;
    transform: scale(1.15);
  }
}

.tree-expand-spacer {
  width: 14px;
  flex-shrink: 0;
}

.tree-item-icon {
  color: #6fb392;
  flex-shrink: 0;
  transition: all .15s;
}

.tree-item-label {
  flex: 1;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// سطح 1: اهداف (Targets) - رنگ سبز تیره
.tree-level-1 {
  margin: 3px 6px;
  
  > .tree-item {
    background: rgba(21, 128, 61, 0.12); // green-700
    border-right: 3px solid #15803d;
    font-weight: 700;
    font-size: 12.5px;
    padding: 8px 10px;
    box-shadow: 0 1px 3px rgba(21, 128, 61, 0.2);
    color: #d1fae5; // green-100
    
    .tree-item-icon {
      color: #86efac; // green-300
      font-size: 16px;
      background: rgba(255,255,255,.15);
      border-radius: 4px;
      padding: 3px;
    }
    
    &:hover {
      background: rgba(21, 128, 61, 0.25);
      transform: translateX(-2px);
      box-shadow: 0 2px 6px rgba(21, 128, 61, 0.3);
    }
    
    &.tree-item--selected {
      background: rgba(21, 128, 61, 0.4) !important;
      border-right-color: #86efac;
      box-shadow: 0 3px 8px rgba(21, 128, 61, 0.4);
      color: #fff !important;
    }
  }
}

// سطح 2: برنامه‌ها (Programs) - رنگ آبی
.tree-level-2 {
  margin-right: 18px;
  margin-top: 3px;
  margin-bottom: 3px;
  
  .tree-item {
    background: rgba(37, 99, 235, 0.12); // blue-600
    border-right: 2px solid #2563eb;
    font-weight: 600;
    font-size: 12px;
    padding: 7px 9px;
    box-shadow: 0 1px 2px rgba(37, 99, 235, 0.15);
    color: #dbeafe; // blue-100
    
    .tree-item-icon {
      color: #93c5fd; // blue-300
      font-size: 15px;
      background: rgba(255,255,255,.12);
      border-radius: 4px;
      padding: 2px;
    }
    
    &:hover {
      background: rgba(37, 99, 235, 0.22);
      transform: translateX(-2px);
      box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);
    }
    
    &.tree-item--selected {
      background: rgba(37, 99, 235, 0.35) !important;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
      color: #fff !important;
    }
  }
}

// سطح 3: اقدامات (Tasks) - رنگ بنفش
.tree-level-3 {
  margin-right: 18px;
  margin-top: 2px;
  margin-bottom: 2px;
  
  .tree-item {
    background: rgba(168, 85, 247, 0.12); // purple-500
    border-right: 2px solid #a855f7;
    font-weight: 500;
    font-size: 11.5px;
    padding: 6px 8px;
    box-shadow: 0 1px 2px rgba(168, 85, 247, 0.12);
    color: #f3e8ff; // purple-100
    
    .tree-item-icon {
      color: #d8b4fe; // purple-300
      font-size: 14px;
      background: rgba(255,255,255,.1);
      border-radius: 3px;
      padding: 2px;
    }
    
    &:hover {
      background: rgba(168, 85, 247, 0.2);
      transform: translateX(-2px);
      box-shadow: 0 2px 4px rgba(168, 85, 247, 0.2);
    }
    
    &.tree-item--selected {
      background: rgba(168, 85, 247, 0.32) !important;
      box-shadow: 0 2px 5px rgba(168, 85, 247, 0.25);
      color: #fff !important;
    }
  }
}

// سطح 4: فعالیت‌ها (Activities) - رنگ نارنجی
.tree-level-4 {
  margin-right: 18px;
  margin-top: 2px;
  margin-bottom: 2px;
  
  .tree-item {
    background: rgba(249, 115, 22, 0.12); // orange-500
    border-right: 1px solid #f97316;
    font-weight: 400;
    font-size: 11px;
    padding: 5px 8px;
    font-style: italic;
    opacity: 0.95;
    box-shadow: 0 1px 2px rgba(249, 115, 22, 0.1);
    color: #fed7aa; // orange-200
    
    .tree-item-icon {
      color: #fdba74; // orange-300
      font-size: 13px;
      background: rgba(255,255,255,.08);
      border-radius: 3px;
      padding: 2px;
    }
    
    &:hover {
      background: rgba(249, 115, 22, 0.2);
      transform: translateX(-2px);
      opacity: 1;
      box-shadow: 0 2px 4px rgba(249, 115, 22, 0.18);
    }
    
    &.tree-item--selected {
      background: rgba(249, 115, 22, 0.3) !important;
      opacity: 1;
      box-shadow: 0 2px 5px rgba(249, 115, 22, 0.25);
      color: #fff !important;
    }
  }
}

.sidebar-footer {
  padding: 0 8px 12px;
  flex-shrink: 0;
  .nav-item--logout {
    color: #ef4444;
    margin-top: 4px;
    &:hover { background: rgba(239,68,68,.1); color: #ef4444; }
    .nav-icon { background: rgba(239,68,68,.08); color: #ef4444; }
    &:hover .nav-icon { color: #ef4444; }
  }
}

.q-page-container {
  transition: margin-right 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
}
.app-page {
  padding: 20px 18px;
  direction: rtl;
}

@media (max-width: 768px) {
  .app-page { padding: 12px; }
  .header-inner { padding: 0 12px; }
  .profile-info { display: none; }
}
</style>
