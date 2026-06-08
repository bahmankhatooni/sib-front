<!-- src/components/PageHeader.vue -->
<template>
  <div class="page-header">
    <!-- سمت راست: آیکون + عنوان -->
    <div class="ph-right">
      <div class="ph-icon" :style="{ background: iconBg }">
        <q-icon :name="icon" size="19px" :style="{ color: iconColor }" />
      </div>
      <div class="ph-text">
        <h2 class="ph-title">{{ title }}</h2>
        <p v-if="subtitle" class="ph-sub">{{ subtitle }}</p>
      </div>
    </div>
    <!-- سمت چپ: دکمه‌های عملیات -->
    <div class="ph-actions">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title:     { type: String, required: true },
    subtitle:  { type: String, default: '' },
    icon:      { type: String, default: 'info' },
    iconBg:    { type: String, default: '#ecfdf5' },
    iconColor: { type: String, default: '#1e8a5e' },
  }
}
</script>

<style lang="scss" scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
  direction: rtl;
  /* پدینگ کافی از بالا */
  padding-top: 4px;
}

.ph-right {
  display: flex; align-items: center; gap: 11px;
}

.ph-icon {
  width: 42px; height: 42px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.ph-text { text-align: right; }
.ph-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 1px; }
.ph-sub   { font-size: 11.5px; color: #94a3b8; }

.ph-actions {
  display: flex; align-items: center; gap: 8px;
}
</style>
