export type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'BARBER' | 'CLIENT'

export type MeUser = {
  id: string
  email: string
  name: string
  role: Role
  active?: boolean
  branches?: { branchId: string }[]
}

type MeResponse = { user: MeUser }

export function useMeState() {
  return useState<MeUser | null>('me', () => null)
}

export async function loadMe(): Promise<MeUser | null> {
  const me = useMeState()
  if (me.value) return me.value

  try {
    const data = await $fetch<MeResponse>('/api/me', { credentials: 'include' })
    const user = data?.user ?? null
    me.value = user
    return user
  } catch {
    return null
  }
}
