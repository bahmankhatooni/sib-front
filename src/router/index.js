import { route } from 'quasar/wrappers'
import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'

export default route(function (/* { store, ssrContext } */) {
  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createWebHistory(),
  })

  // ============================================================
  // Route Guard - محافظت از مسیرها
  // ============================================================
  Router.beforeEach((to, from, next) => {
    // بررسی وجود توکن در localStorage
    const token = localStorage.getItem('auth_token')
    const isAuthenticated = !!token  // تبدیل به boolean

    // لیست مسیرهای عمومی (نیاز به لاگین ندارند)
    const publicRoutes = ['/login']

    // بررسی اینکه مسیر جاری عمومی است یا نه
    const isPublicRoute = publicRoutes.includes(to.path)

    // اگر کاربر لاگین نکرده و می‌خواهد به مسیر غیرعمومی برود
    if (!isAuthenticated && !isPublicRoute) {
      console.log('🔒 دسترسی غیرمجاز، هدایت به صفحه لاگین')
      next('/login')
      return
    }

    // اگر کاربر لاگین کرده و می‌خواهد به صفحه لاگین برود
    if (isAuthenticated && to.path === '/login') {
      console.log('✅ قبلاً وارد شده‌اید، هدایت به داشبورد')
      next('/dashboard')
      return
    }

    // در غیر این صورت، اجازه دسترسی بده
    next()
  })

  return Router
})
