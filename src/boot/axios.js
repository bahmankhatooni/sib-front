import { boot } from 'quasar/wrappers'
import axios from 'axios'

// ساخت نمونه axios با تنظیمات صحیح
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',  // توجه: /api در انتها
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

const setupAxiosInterceptors = (router) => {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        delete api.defaults.headers.common['Authorization']

        if (router && router.currentRoute.value.path !== '/login') {
          router.push('/login')
        }
      }
      return Promise.reject(error)
    }
  )
}

export default boot(({ app, router }) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  setupAxiosInterceptors(router)

  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api, setupAxiosInterceptors }
