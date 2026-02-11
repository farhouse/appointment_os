export default defineNuxtRouteMiddleware(async (to) => {
  // Enforce auth for /private/** pages.
  // Server is the source of truth; we check by calling /api/me.
  const me = useState<any | null>('me', () => null)

  if (!me.value) {
    const { data, error } = await useFetch('/api/me')
    if (error.value) {
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }
    me.value = data.value?.user ?? data.value
  }
})
