// src/boot/i18n.js — تنظیم زبان فارسی و RTL برای Quasar
import { Quasar } from 'quasar'
import langFaIR from 'quasar/lang/fa-IR'

export default ({ app }) => {
  // تنظیم زبان فارسی
  Quasar.lang.set(langFaIR)
}
