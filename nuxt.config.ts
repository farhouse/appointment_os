// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/i18n'],
  css: ['~/assets/css/main.css'],
  build: {
    transpile: ['@fullcalendar/vue3']
  },
  // @ts-expect-error - injected by @nuxtjs/i18n module
  i18n: {
    defaultLocale: 'es-AR',
    locales: [
      { code: 'es-AR', iso: 'es-AR', name: 'Español (AR)', file: 'es-AR.json' },
      { code: 'en', iso: 'en-US', name: 'English', file: 'en.json' }
    ],
    lazy: true,
    langDir: 'locales',
    i18nDir: 'i18n'
  }
})
