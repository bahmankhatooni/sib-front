<!-- src/pages/ProfilePage.vue -->
<template>
  <div class="page-root">

    <PageHeader title="پروفایل کاربری" subtitle="مشاهده و ویرایش اطلاعات حساب کاربری" icon="person_outline">
      <q-btn unelevated color="primary" icon="edit" label="ویرایش پروفایل" @click="openEditDialog" />
    </PageHeader>

    <div class="profile-container">
      <!-- بخش اطلاعات شخصی -->
      <div class="profile-card">
        <div class="profile-header">
          <div class="profile-avatar-large">
            <div class="avatar-initial">{{ userInitial }}</div>
          </div>
          <div class="profile-info">
            <h2 class="profile-name">{{ userFullName }}</h2>
            <span class="profile-role-badge">{{ userRole }}</span>
            <span class="profile-unit-badge" v-if="userUnit">{{ userUnit }}</span>
          </div>
        </div>

        <div class="profile-details">
          <div class="details-section">
            <h3 class="section-title">
              <q-icon name="info" size="18px" />
              اطلاعات ورود
            </h3>
            <div class="detail-row">
              <span class="detail-label">نام کاربری:</span>
              <span class="detail-value">{{ user.username || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">ایمیل:</span>
              <span class="detail-value">{{ user.email || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">شماره تماس:</span>
              <span class="detail-value">{{ user.phone || '—' }}</span>
            </div>
          </div>

          <div class="details-section">
            <h3 class="section-title">
              <q-icon name="business" size="18px" />
              اطلاعات سازمانی
            </h3>
            <div class="detail-row">
              <span class="detail-label">واحد:</span>
              <span class="detail-value">{{ userUnit || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">نقش:</span>
              <span class="detail-value">{{ userRole || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">وضعیت:</span>
              <span class="detail-value">
                <span class="status-badge" :class="user.is_active ? 'badge-active' : 'badge-inactive'">
                  {{ user.is_active ? 'فعال' : 'غیرفعال' }}
                </span>
              </span>
            </div>
          </div>

          <div class="details-section">
            <h3 class="section-title">
              <q-icon name="calendar_today" size="18px" />
              اطلاعات سیستمی
            </h3>
            <div class="detail-row">
              <span class="detail-label">تاریخ عضویت:</span>
              <span class="detail-value">{{ formatDate(user.created_at) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">آخرین ورود:</span>
              <span class="detail-value">{{ user.last_login || '—' }}</span>
            </div>
          </div>
        </div>

        <div class="profile-actions">
          <q-btn outline color="primary" icon="lock" label="تغییر رمز عبور" @click="openPassDialog" />
        </div>
      </div>
    </div>

    <!-- دیالوگ ویرایش پروفایل -->
    <q-dialog v-model="editDialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>ویرایش پروفایل</h3>
          <button class="dialog-close" @click="editDialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">
          <div class="form-row">
            <div class="form-group">
              <label>نام <span class="req">*</span></label>
              <q-input v-model="editForm.first_name" outlined dense hide-bottom-space />
            </div>
            <div class="form-group">
              <label>نام خانوادگی <span class="req">*</span></label>
              <q-input v-model="editForm.last_name" outlined dense hide-bottom-space />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>ایمیل</label>
              <q-input v-model="editForm.email" outlined dense type="email" hide-bottom-space />
            </div>
            <div class="form-group">
              <label>شماره تماس</label>
              <q-input v-model="editForm.phone" outlined dense hide-bottom-space />
            </div>
          </div>
        </div>
        <div class="dialog-foot">
          <q-btn flat label="انصراف" @click="editDialog=false" />
          <q-btn unelevated color="primary" label="ذخیره تغییرات" @click="saveProfile" :loading="saving" />
        </div>
      </div>
    </q-dialog>

    <!-- دیالوگ تغییر رمز عبور -->
    <q-dialog v-model="passDialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>تغییر رمز عبور</h3>
          <button class="dialog-close" @click="passDialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>رمز عبور فعلی <span class="req">*</span></label>
            <q-input v-model="passForm.current_password" outlined dense type="password" hide-bottom-space />
          </div>
          <div class="form-group">
            <label>رمز عبور جدید <span class="req">*</span></label>
            <q-input v-model="passForm.new_password" outlined dense type="password" hide-bottom-space />
          </div>
          <div class="form-group">
            <label>تکرار رمز عبور جدید <span class="req">*</span></label>
            <q-input v-model="passForm.new_password_confirmation" outlined dense type="password" hide-bottom-space />
          </div>
        </div>
        <div class="dialog-foot">
          <q-btn flat label="انصراف" @click="passDialog=false" />
          <q-btn unelevated color="primary" label="تغییر رمز" @click="changePassword" :loading="changingPass" />
        </div>
      </div>
    </q-dialog>

  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import PageHeader from 'components/PageHeader.vue'

export default {
  components: { PageHeader },
  setup() {
    const $q = useQuasar()
    
    // وضعیت‌ها
    const loading = ref(false)
    const saving = ref(false)
    const changingPass = ref(false)
    const editDialog = ref(false)
    const passDialog = ref(false)
    const user = ref({})
    
    // فرم ویرایش
    const editForm = ref({
      first_name: '',
      last_name: '',
      email: '',
      phone: ''
    })
    
    // فرم تغییر رمز
    const passForm = ref({
      current_password: '',
      new_password: '',
      new_password_confirmation: ''
    })
    
    // ============================================================
    // کامپوتی‌ها
    // ============================================================
    const userFullName = computed(() => {
      return `${user.value.first_name || ''} ${user.value.last_name || ''}`.trim() || 'کاربر'
    })
    
    const userInitial = computed(() => {
      if (user.value.first_name) {
        return user.value.first_name.charAt(0)
      }
      return 'ک'
    })
    
    const userRole = computed(() => {
      return user.value.role?.name || '—'
    })
    
    const userUnit = computed(() => {
      return user.value.unit?.name || '—'
    })
    
    // ============================================================
    // توابع کمکی
    // ============================================================
    const formatDate = (dateString) => {
      if (!dateString) return '—'
      const date = new Date(dateString)
      return date.toLocaleDateString('fa-IR')
    }
    
    // ============================================================
    // دریافت اطلاعات کاربر
    // ============================================================
    const fetchUserProfile = async () => {
      loading.value = true
      try {
        const response = await api.get('/me')
        if (response.data.success) {
          user.value = response.data.data
          // پر کردن فرم ویرایش
          editForm.value = {
            first_name: user.value.first_name || '',
            last_name: user.value.last_name || '',
            email: user.value.email || '',
            phone: user.value.phone || ''
          }
        }
      } catch (error) {
        console.error('Fetch profile error:', error)
        $q.notify({
          type: 'negative',
          message: 'خطا در دریافت اطلاعات کاربر',
          position: 'top'
        })
      } finally {
        loading.value = false
      }
    }
    
    // ============================================================
    // باز کردن دیالوگ ویرایش
    // ============================================================
    const openEditDialog = () => {
      editForm.value = {
        first_name: user.value.first_name || '',
        last_name: user.value.last_name || '',
        email: user.value.email || '',
        phone: user.value.phone || ''
      }
      editDialog.value = true
    }
    
    // ============================================================
    // ذخیره اطلاعات پروفایل
    // ============================================================
    const saveProfile = async () => {
      if (!editForm.value.first_name || !editForm.value.last_name) {
        $q.notify({
          type: 'negative',
          message: 'نام و نام خانوادگی الزامی هستند',
          position: 'top'
        })
        return
      }
      
      saving.value = true
      try {
        const response = await api.put(`/users/${user.value.id}`, editForm.value)
        if (response.data.success) {
          $q.notify({
            type: 'positive',
            message: 'اطلاعات با موفقیت به‌روزرسانی شد',
            position: 'top'
          })
          // به‌روزرسانی localStorage
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
          storedUser.first_name = editForm.value.first_name
          storedUser.last_name = editForm.value.last_name
          storedUser.email = editForm.value.email
          storedUser.phone = editForm.value.phone
          localStorage.setItem('user', JSON.stringify(storedUser))
          
          await fetchUserProfile()
          editDialog.value = false
        }
      } catch (error) {
        console.error('Save profile error:', error)
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'خطا در ذخیره اطلاعات',
          position: 'top'
        })
      } finally {
        saving.value = false
      }
    }
    
    // ============================================================
    // باز کردن دیالوگ تغییر رمز
    // ============================================================
    const openPassDialog = () => {
      passForm.value = {
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
      }
      passDialog.value = true
    }
    
    // ============================================================
    // تغییر رمز عبور
    // ============================================================
    const changePassword = async () => {
      if (!passForm.value.current_password) {
        $q.notify({
          type: 'negative',
          message: 'رمز عبور فعلی را وارد کنید',
          position: 'top'
        })
        return
      }
      
      if (!passForm.value.new_password || passForm.value.new_password.length < 6) {
        $q.notify({
          type: 'negative',
          message: 'رمز عبور جدید باید حداقل 6 کاراکتر باشد',
          position: 'top'
        })
        return
      }
      
      if (passForm.value.new_password !== passForm.value.new_password_confirmation) {
        $q.notify({
          type: 'negative',
          message: 'رمز عبور جدید و تکرار آن مطابقت ندارند',
          position: 'top'
        })
        return
      }
      
      changingPass.value = true
      try {
        const response = await api.post('/change-password', {
          current_password: passForm.value.current_password,
          new_password: passForm.value.new_password,
          new_password_confirmation: passForm.value.new_password_confirmation
        })
        
        if (response.data.success) {
          $q.notify({
            type: 'positive',
            message: 'رمز عبور با موفقیت تغییر کرد',
            position: 'top'
          })
          passDialog.value = false
        }
      } catch (error) {
        console.error('Change password error:', error)
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'خطا در تغییر رمز عبور',
          position: 'top'
        })
      } finally {
        changingPass.value = false
      }
    }
    
    // ============================================================
    // بارگذاری اولیه
    // ============================================================
    onMounted(() => {
      fetchUserProfile()
    })
    
    return {
      loading,
      saving,
      changingPass,
      editDialog,
      passDialog,
      user,
      editForm,
      passForm,
      userFullName,
      userInitial,
      userRole,
      userUnit,
      formatDate,
      openEditDialog,
      saveProfile,
      openPassDialog,
      changePassword
    }
  }
}
</script>

<style lang="scss" scoped>
@import './page-shared.scss';

.profile-container {
  max-width: 800px;
  margin: 0 auto;
}

.profile-card {
  background: #fff;
  border-radius: 24px;
  border: 1px solid #eef2f6;
  overflow: hidden;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 32px;
  background: linear-gradient(135deg, #f8fbf9 0%, #ffffff 100%);
  border-bottom: 1px solid #eef2f6;
}

.profile-avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e8a5e, #166b49);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(30,138,94,.3);
  
  .avatar-initial {
    font-size: 40px;
    font-weight: 800;
    color: #fff;
  }
}

.profile-info {
  flex: 1;
  
  .profile-name {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
  }
  
  .profile-role-badge {
    display: inline-block;
    background: #e8f5e9;
    color: #2e7d64;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    margin-left: 8px;
  }
  
  .profile-unit-badge {
    display: inline-block;
    background: #e3f2fd;
    color: #1565c0;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }
}

.profile-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 32px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

.details-section {
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #eef2f6;
  }
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 13px;
  
  .detail-label {
    color: #64748b;
    font-weight: 500;
  }
  
  .detail-value {
    color: #1e293b;
    font-weight: 500;
  }
}

.profile-actions {
  padding: 20px 32px;
  border-top: 1px solid #eef2f6;
  display: flex;
  justify-content: center;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 500;
}

.badge-active {
  background: #dcfce7;
  color: #15803d;
}

.badge-inactive {
  background: #fee2e2;
  color: #b91c1c;
}
</style>