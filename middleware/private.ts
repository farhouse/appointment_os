import { loadMe } from '~/composables/useMe'

export default defineNuxtRouteMiddleware(async (to) => {
  // Enforce auth for /private/** pages.
  // Server is the source of truth; we check by calling /api/me.
  const user = await loadMe()
  if (!user) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
