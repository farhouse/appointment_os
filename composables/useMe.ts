export type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'BARBER' | 'CLIENT'

export type MeUser = {
  id: string
  email: string
  name: string
  role: Role
  active?: boolean
}

type MeResponse = { user: MeUser }

export function useMeState() {
  return useState<MeUser | null>('me', () => null)
}

export async function loadMe(): Promise<MeUser | null> {
  const me = useMeState()
  if (me.value) return me.value

  const { data, error } = await useFetch<MeResponse>('/api/me')
  if (error.value) return null

  const user = data.value?.user ?? null
  me.value = user
  return user
}
