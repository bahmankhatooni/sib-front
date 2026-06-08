<!-- src/pages/LoginPage.vue -->
<template>
  <div class="login-root">

    <!-- ستون چپ: پنل معرفی -->
    <div class="brand-panel">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>

      <div class="brand-content">
        <div class="brand-logo">
          <div class="logo-circle">
            <img src="~assets/logo.png" alt="سیب" class="logo-icon" />
          </div>
        </div>
        <br>
        <h1 class="brand-name" style="margin-bottom: -10px; color: red">سیـب</h1>
        <h4 class="brand-tagline" style="margin-bottom: 10px">سامانه یکپارچه برنامه عملیاتی</h4>

        <div class="brand-divider"></div>

        <ul class="feature-list">
          <li v-for="f in features" :key="f.text">
            <div class="feature-icon-wrap">
              <q-icon :name="f.icon" size="16px" />
            </div>
            <span>{{ f.text }}</span>
          </li>
        </ul>
      </div>

      <p class="brand-copy">© ۱۴۰۴ سامانه سیب — تمام حقوق محفوظ است</p>
    </div>

    <!-- ستون راست: فرم ورود -->
    <div class="form-panel">
      <div class="form-card">

        <div class="form-header">
          <div class="form-icon">
            <q-icon name="lock_open" size="22px" color="white" />
          </div>
          <h2 class="form-title">ورود به سامانه</h2>
          <p class="form-subtitle">اطلاعات حساب کاربری خود را وارد کنید</p>
        </div>

        <q-form @submit.prevent="onSubmit" class="form-body">

          <div class="field-group">
            <label class="field-label">نام کاربری</label>
            <q-input
              v-model="username"
              outlined
              dense
              placeholder="نام کاربری خود را وارد کنید"
              :rules="[v => !!v || 'نام کاربری الزامی است']"
              hide-bottom-space
            >
              <template #prepend>
                <q-icon name="person_outline" size="18px" color="grey-5" />
              </template>
            </q-input>
          </div>

          <div class="field-group">
            <label class="field-label">رمز عبور</label>
            <q-input
              v-model="password"
              outlined
              dense
              :type="showPass ? 'text' : 'password'"
              placeholder="رمز عبور خود را وارد کنید"
              :rules="[v => !!v || 'رمز عبور الزامی است']"
              hide-bottom-space
            >
              <template #prepend>
                <q-icon name="lock_outline" size="18px" color="grey-5" />
              </template>
              <template #append>
                <q-icon
                  :name="showPass ? 'visibility_off' : 'visibility'"
                  size="18px"
                  color="grey-5"
                  class="cursor-pointer"
                  @click="showPass = !showPass"
                />
              </template>
            </q-input>
          </div>

          <div class="forgot-row">
            <a href="#" class="forgot-link">فراموشی رمز عبور؟</a>
          </div>

          <q-btn
            type="submit"
            unelevated
            class="login-btn full-width"
            :loading="loading"
          >
            <q-icon name="login" size="18px" class="q-ml-sm" />
            ورود به سامانه
          </q-btn>

        </q-form>

        <transition name="fade">
          <div v-if="errorMsg" class="error-alert">
            <q-icon name="error_outline" size="16px" />
            <span>{{ errorMsg }}</span>
          </div>
        </transition>

      </div>
    </div>

  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'
import { api, setupAxiosInterceptors } from 'src/boot/axios'

export default {
  setup () {
    const $q = useQuasar()
    const router = useRouter()
    const username = ref('admin')
    const password = ref('12345678')
    const showPass = ref(false)
    const loading = ref(false)
    const errorMsg = ref('')

    const features = [
      { icon: 'dashboard_customize', text: 'مدیریت هوشمند برنامه‌های عملیاتی' },
      { icon: 'dynamic_form',        text: 'فرم‌های پویا و قابل شخصی‌سازی' },
      { icon: 'bar_chart',           text: 'گزارش‌گیری پیشرفته و خروجی Excel' },
      { icon: 'admin_panel_settings',text: 'کنترل دسترسی بر اساس نقش و واحد' },
    ]

    // تابع دریافت CSRF cookie
    const fetchCsrfCookie = async () => {
      try {
        await axios.get('http://127.0.0.1:8000/sanctum/csrf-cookie', {
          withCredentials: true
        })
        console.log('CSRF cookie received')
        return true
      } catch (error) {
        console.error('CSRF cookie fetch failed:', error)
        return false
      }
    }

    const onSubmit = async () => {
      errorMsg.value = ''

      if (!username.value || !password.value) {
        errorMsg.value = 'لطفاً نام کاربری و رمز عبور را وارد کنید.'
        return
      }

      loading.value = true

      try {
        // مرحله 1: دریافت CSRF cookie
        await fetchCsrfCookie()

        // مرحله 2: ارسال درخواست لاگین
        const response = await api.post('login', {
          username: username.value,
          password: password.value
        })

        console.log('Login response:', response.data)

        if (response.data.success) {
          const token = response.data.data.token
          const user = response.data.data.user

          localStorage.setItem('auth_token', token)
          localStorage.setItem('user', JSON.stringify(user))

          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          setupAxiosInterceptors(router)

          $q.notify({
            type: 'positive',
            message: response.data.message || 'ورود با موفقیت انجام شد',
            position: 'top'
          })

          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Login error:', error)

        if (error.response) {
          const data = error.response.data
          if (data.message) {
            errorMsg.value = data.message
          } else if (data.errors) {
            const firstError = Object.values(data.errors)[0]?.[0]
            errorMsg.value = firstError || 'اطلاعات وارد شده صحیح نیست.'
          } else {
            errorMsg.value = 'ورود ناموفق. لطفاً مجدداً تلاش کنید.'
          }
        } else if (error.request) {
          errorMsg.value = 'خطا در ارتباط با سرور. لطفاً مجدداً تلاش کنید.'
        } else {
          errorMsg.value = 'خطایی رخ داده است: ' + error.message
        }
      } finally {
        loading.value = false
      }
    }

    return {
      username,
      password,
      showPass,
      loading,
      errorMsg,
      features,
      onSubmit
    }
  }
}
</script>

<style lang="scss" scoped>
// استایل‌ها همانند قبل保持不变
.login-root {
  min-height: 100vh;
  display: flex;
  direction: rtl;
  background: #f1f5f9;
}

.brand-panel {
  flex: 0 0 420px;
  background: linear-gradient(160deg, #0f2d1f 0%, #1e5c3a 55%, #1a8a5e 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  position: relative;
  overflow: hidden;
  color: #fff;
}

.blob {
  position: absolute;
  border-radius: 50%;
  opacity: .08;
  background: #fff;
}
.blob-1 { width: 320px; height: 320px; top: -80px; right: -80px; }
.blob-2 { width: 200px; height: 200px; bottom: 60px; left: -60px; }
.blob-3 { width: 120px; height: 120px; top: 50%; left: 30px; transform: translateY(-50%); }

.brand-content {
  position: relative;
  z-index: 1;
  text-align: center;
  width: 100%;
}

.brand-logo .logo-circle {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e8a5e, #166b49);
  border: 2px solid rgba(255,255,255,.3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(30,138,94,.3);
}

.brand-logo .logo-icon {
  width: 120px;
  height: 120px;
  object-fit: contain;
}

.brand-name {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: 4px;
  margin-bottom: 10px;
  color: #fff;
}

.brand-tagline {
  font-size: 15px;
  opacity: .8;
  line-height: 1.8;
  margin-bottom: 32px;
}

.brand-divider {
  width: 48px;
  height: 3px;
  background: rgba(255,255,255,.4);
  border-radius: 99px;
  margin: 0 auto 32px;
}

.feature-list {
  list-style: none;
  text-align: right;
  max-width: 280px;
  margin: 0 auto;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 13.5px;
  opacity: .9;
}

.feature-icon-wrap {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(255,255,255,.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}

.brand-copy {
  position: absolute;
  bottom: 20px;
  font-size: 11px;
  opacity: .45;
  z-index: 1;
}

.form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background: #f1f5f9;
}

.form-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 20px;
  padding: 40px 36px;
  box-shadow: 0 4px 24px rgba(0,0,0,.08);
  border: 1px solid #e2e8f0;
}

.form-header {
  text-align: center;
  margin-bottom: 32px;
}

.form-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #1e8a5e, #166b49);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(30,138,94,.3);
}

.form-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 6px;
}

.form-subtitle {
  font-size: 13px;
  color: #64748b;
}

.form-body { display: flex; flex-direction: column; gap: 4px; }

.field-group { margin-bottom: 16px; }

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.forgot-row {
  text-align: left;
  margin-bottom: 24px;
  margin-top: -4px;
}

.forgot-link {
  font-size: 12.5px;
  color: #1e8a5e;
  text-decoration: none;
  font-weight: 500;
}

.forgot-link:hover { text-decoration: underline; }

.login-btn {
  height: 46px;
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(135deg, #1e8a5e 0%, #166b49 100%) !important;
  color: #fff !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 14px rgba(30,138,94,.35) !important;
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(30,138,94,.45) !important;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 14px;
  background: #fee2e2;
  border-radius: 10px;
  color: #b91c1c;
  font-size: 13px;
  font-weight: 500;
}

.fade-enter-active, .fade-leave-active { transition: opacity .25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .login-root { flex-direction: column; }
  .brand-panel {
    flex: none;
    padding: 36px 24px 28px;
  }
  .brand-panel .feature-list { display: none; }
  .brand-panel .brand-tagline { margin-bottom: 0; }
  .brand-panel .brand-divider { display: none; }
  .form-card { padding: 28px 20px; }
}
</style>
