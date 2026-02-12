// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/i18n'],
  css: [
    '~/assets/css/main.css',
    '@fullcalendar/common/main.css',
    '@fullcalendar/daygrid/main.css',
    '@fullcalendar/timegrid/main.css'
  ],
  build: {
    transpile: ['@fullcalendar/vue3']
  },
  i18n: {
    defaultLocale: 'es-AR',
    locales: [
      { code: 'es-AR', iso: 'es-AR', name: 'Español (AR)', file: 'es-AR.json' },
      { code: 'en', iso: 'en-US', name: 'English', file: 'en.json' }
    ],
    // @ts-ignore - module runtime supports this option
    lazy: true,
    langDir: 'locales',
    i18nDir: 'i18n'
  }
})
