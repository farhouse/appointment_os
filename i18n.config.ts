import en from './i18n/locales/en.json'
import esAR from './i18n/locales/es-AR.json'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'es-AR',
  fallbackLocale: 'es-AR',
  messages: {
    'es-AR': esAR as any,
    en: en as any
  }
}))
