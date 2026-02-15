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
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    },
    locales: [
      { code: 'es-AR', iso: 'es-AR', name: 'Español (AR)', file: 'es-AR.json' },
      { code: 'en', iso: 'en-US', name: 'English', file: 'en.json' }
    ],
    // @ts-ignore - module runtime supports this option
    lazy: true,
    langDir: 'locales'
  }
})
