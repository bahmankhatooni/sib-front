<template>
  <div class="forgot-container">
    <div class="forgot-card">
      <div class="icon-wrapper">
        <div class="icon-circle">
          <q-icon name="lock" size="40px" color="white" />
        </div>
      </div>

      <h2 class="forgot-title">فراموشی رمز عبور</h2>
      
      <div class="message-box">
        <p class="message-text">
          به دلیل عدم دسترسی به اینترنت، امکان بازگرداندن رمز عبور توسط کاربر فراهم نمی‌باشد
        </p>
        <p class="message-text contact-text">
          لطفاً با مدیر سیستم تماس بگیرید
        </p>
      </div>

      <q-btn
        unelevated
        class="back-btn"
        icon="arrow_back"
        label="بازگشت به صفحه ورود"
        @click="$router.push('/login')"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'ForgotPasswordPage'
}
</script>

<style lang="scss" scoped>
.forgot-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  padding: 20px;
}

.forgot-card {
  max-width: 450px;
  width: 100%;
  background: #fff;
  border-radius: 28px;
  padding: 48px 36px;
  text-align: center;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.1);
  border: 1px solid #eef2f6;
}

.icon-wrapper {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.icon-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.forgot-title {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 20px 0;
}

.message-box {
  background: #fef2f2;
  border-radius: 16px;
  padding: 24px 20px;
  margin-bottom: 32px;
  border: 1px solid #fee2e2;
}

.message-text {
  font-size: 14px;
  line-height: 1.7;
  color: #7f1d1d;
  margin: 0;
  
  &.contact-text {
    margin-top: 12px;
    font-weight: 600;
    color: #b91c1c;
  }
}

.back-btn {
  width: 100%;
  height: 46px;
  font-size: 14px;
  font-weight: 600;
  background: #f1f5f9 !important;
  color: #334155 !important;
  border-radius: 12px !important;
  
  &:hover {
    background: #e2e8f0 !important;
  }
}
</style>