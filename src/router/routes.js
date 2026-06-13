const routes = [
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue'),
    meta: { requiresAuth: false, isPublic: true }
  },
      
  {
    path: '/forgot-password',  
    component: () => import('pages/ForgotPasswordPage.vue'),
    meta: { requiresAuth: false, isPublic: true }
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: () => import('pages/DashboardPage.vue') },
      { path: 'units', component: () => import('pages/UnitsPage.vue') },
      { path: 'roles', component: () => import('pages/RolesPage.vue') },
      { path: 'users', component: () => import('pages/UsersPage.vue') },
      { path: 'targets', component: () => import('pages/TargetsPage.vue') },
      { path: 'programs', component: () => import('pages/ProgramsPage.vue') },
      { path: 'tasks', component: () => import('pages/TasksPage.vue') },
      { path: 'activities', component: () => import('pages/ActivitiesPage.vue') },
      { path: 'forms', component: () => import('pages/FormsPage.vue') },
      { path: 'reports', component: () => import('pages/ReportsPage.vue') },
      { path: 'profile', component: () => import('pages/ProfilePage.vue') },
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

export default routes
