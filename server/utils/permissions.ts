import type { H3Event } from 'h3'
import type { Role } from '@prisma/client'

import type { AuthUser } from '~/server/utils/auth'
import { forbidden, unauthorized } from '~/server/utils/errors'

export function getAuthUser(event: H3Event): AuthUser {
  const u = event.context.user
  if (!u?.userId || !u?.role) {
    unauthorized('Unauthorized')
  }
  return u as AuthUser
}

export function requireRole(event: H3Event, roles: Role[]) {
  const u = getAuthUser(event)
  if (!roles.includes(u.role)) {
    forbidden('Forbidden')
  }
  return u
}
