/**
 * src/boot/rtl-drawer-fix.js
 *
 * در محیط RTL، Quasar برای right drawer از padding-left روی q-page-container
 * استفاده می‌کند که اشتباه است. این boot file یک MutationObserver می‌سازد
 * که هر بار padding-left تغییر کرد، آن را به padding-right منتقل می‌کند.
 */

export default ({ app }) => {
  // فقط در مرورگر اجرا می‌شود
  if (typeof window === 'undefined') return

  const fixDrawerPadding = () => {
    const container = document.querySelector('.q-page-container')
    if (!container) return

    const paddingLeft = container.style.paddingLeft
    if (paddingLeft && paddingLeft !== '0px' && paddingLeft !== '0') {
      // Quasar padding-left داده — ما آن را به padding-right منتقل می‌کنیم
      container.style.paddingRight = paddingLeft
      container.style.paddingLeft  = '0px'
    }
  }

  // اجرای اولیه بعد از mount
  setTimeout(fixDrawerPadding, 100)
  setTimeout(fixDrawerPadding, 300)

  // MutationObserver برای تغییرات بعدی (باز/بسته شدن drawer)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'style' &&
        mutation.target.classList.contains('q-page-container')
      ) {
        // از setTimeout برای جلوگیری از loop استفاده می‌کنیم
        setTimeout(fixDrawerPadding, 0)
        break
      }
    }
  })

  // شروع observe بعد از mount
  setTimeout(() => {
    const container = document.querySelector('.q-page-container')
    if (container) {
      observer.observe(container, {
        attributes: true,
        attributeFilter: ['style']
      })
    }
  }, 200)
}
