import { loadMe } from '~/composables/useMe'

export default defineNuxtRouteMiddleware(async (to) => {
  // If there are no users yet, force the initial setup flow.
  // This must run before auth, otherwise you can't login.
  try {
    const { needsSetup } = await $fetch<{ needsSetup: boolean }>('/api/setup/status')
    if (needsSetup && to.path !== '/setup') {
      return navigateTo('/setup')
    }
  } catch {
    // ignore
  }

  // Enforce auth for /private/** pages.
  // Server is the source of truth; we check by calling /api/me.
  const user = await loadMe()
  if (!user) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
