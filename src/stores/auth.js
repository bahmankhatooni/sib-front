import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isAuthenticated: false
  }),

  getters: {
    isAdmin: (state) => state.user?.role?.slug === 'ADMIN',
    isUnitRecorder: (state) => state.user?.role?.slug === 'UNIT_RECORDER',
    userUnit: (state) => state.user?.unit
  },

  actions: {
    async login(credentials) {
      try {
        const response = await api.post('/login', credentials)
        
        if (response.data.success) {
          const { user, token } = response.data
          
          this.user = user
          this.token = token
          this.isAuthenticated = true
          
          // Save to localStorage
          localStorage.setItem('auth_token', token)
          localStorage.setItem('user', JSON.stringify(user))
          
          // Set default header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          return { success: true, user, token }
        } else {
          throw new Error(response.data.message || 'خطا در ورود به سیستم')
        }
      } catch (error) {
        const message = error.response?.data?.message || error.message || 'خطا در ورود به سیستم'
        return { success: false, message }
      }
    },

    async logout() {
      try {
        await api.post('/logout')
      } catch (error) {
        // Continue with logout even if API call fails
        console.error('Logout API error:', error)
      } finally {
        this.clearAuth()
      }
    },

    clearAuth() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      delete api.defaults.headers.common['Authorization']
    },

    initializeAuth() {
      const token = localStorage.getItem('auth_token')
      const userString = localStorage.getItem('user')
      
      if (token && userString) {
        try {
          const user = JSON.parse(userString)
          this.user = user
          this.token = token
          this.isAuthenticated = true
          
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } catch (error) {
          console.error('Error parsing stored user data:', error)
          this.clearAuth()
        }
      }
    },

    async fetchUserProfile() {
      try {
        const response = await api.get('/me')
        if (response.data.success) {
          this.user = response.data.user
          localStorage.setItem('user', JSON.stringify(response.data.user))
          return response.data.user
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        if (error.response?.status === 401) {
          this.clearAuth()
        }
        throw error
      }
    }
  }
})