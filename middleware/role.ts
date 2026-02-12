import type { Role } from '~/composables/useMe'
import { loadMe } from '~/composables/useMe'

export default defineNuxtRouteMiddleware(async (to) => {
  // Ensure we have an auth session; keep role guard behavior consistent
  // even if someone attaches only `middleware: ['role']` by accident.
  if (!to.meta.middleware || !Array.isArray(to.meta.middleware) || !to.meta.middleware.includes('private')) {
    const me = await loadMe()
    if (!me) {
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }
  }

  const roles = (to.meta.roles as Role[] | undefined) ?? undefined
  if (!roles || roles.length === 0) return

  const me = await loadMe()
  if (!me) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  const role = me.role
  if (!role || !roles.includes(role)) {
    // If they're logged in but not allowed, send them to /private (which will redirect by role)
    return navigateTo('/private')
  }
})
