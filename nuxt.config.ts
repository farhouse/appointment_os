// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@nuxtjs/color-mode'],
  css: [
    '~/assets/css/main.css',
    'vue-cal/style'
  ],
  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light'
  },
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'es-AR',
    vueI18n: './i18n.config.ts',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    },
    locales: [
      { code: 'es-AR', iso: 'es-AR', name: 'Español (AR)' },
      { code: 'en', iso: 'en-US', name: 'English' }
    ]
  }
})
