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
              <q-item clickable dense class="dropdown-item">
                <q-item-section avatar><q-icon name="person_outline" size="18px" /></q-item-section>
                <q-item-section>پروفایل من</q-item-section>
              </q-item>
              <q-item clickable dense class="dropdown-item">
                <q-item-section avatar><q-icon name="settings" size="18px" /></q-item-section>
                <q-item-section>تنظیمات</q-item-section>
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

    // لیست کامل منوها با تعیین نقش‌های مجاز
    const allMenuItems = [
      { title: 'داشبورد',   icon: 'dashboard',       to: '/dashboard',  roles: ['ADMIN', 'UNIT_USER'] },
      { title: 'واحدها',    icon: 'corporate_fare',  to: '/units',      roles: ['ADMIN'] },
      { title: 'نقش‌ها',    icon: 'manage_accounts', to: '/roles',      roles: ['ADMIN'] },
      { title: 'کاربران',   icon: 'group',           to: '/users',      roles: ['ADMIN'] },
      { title: 'اهداف',     icon: 'track_changes',   to: '/targets',    roles: ['ADMIN'] },
      { title: 'برنامه‌ها', icon: 'event_note',      to: '/programs',   roles: ['ADMIN', 'UNIT_USER'] },
      { title: 'اقدامات',   icon: 'checklist_rtl',   to: '/tasks',      roles: ['ADMIN', 'UNIT_USER'] },
      { title: 'فعالیت‌ها', icon: 'article',         to: '/activities', roles: ['ADMIN', 'UNIT_USER'] },
      { title: 'کاربرگ‌ها', icon: 'description',     to: '/forms',      roles: ['ADMIN', 'UNIT_USER'] },  // اضافه شده
      { title: 'گزارش‌ها',  icon: 'insert_chart',    to: '/reports',    roles: ['ADMIN', 'UNIT_USER'] },
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
      '/programs':   'مدیریت برنامه‌ها',
      '/tasks':      'مدیریت اقدامات',
      '/activities': 'مدیریت فعالیت‌ها',
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
        ok: { label: 'بله، خارج شو', color: 'negative', unelevated: true },
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
      userEmail
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

.header-start { display: flex; align-items: center; gap: 10px; }
.header-end   { display: flex; align-items: center; gap: 4px; }

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
