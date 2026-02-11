type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'BARBER' | 'CLIENT'

export default defineNuxtRouteMiddleware(async (to) => {
  const roles = (to.meta.roles as Role[] | undefined) ?? undefined
  if (!roles || roles.length === 0) return

  const me = useState<any | null>('me', () => null)

  if (!me.value) {
    const { data, error } = await useFetch('/api/me')
    if (error.value) {
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }
    me.value = data.value?.user ?? data.value
  }

  const role = me.value?.role as Role | undefined
  if (!role || !roles.includes(role)) {
    // If they're logged in but not allowed, send them to /private (which will redirect by role)
    return navigateTo('/private')
  }
})
