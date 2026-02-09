import { createError } from 'h3'
import type { Role } from '@prisma/client'

export type AuthUser = {
  userId: string
  role: Role
  email?: string
}

export function getAuthUser(event: any): AuthUser {
  const u = event?.context?.user
  if (!u?.userId || !u?.role) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return u as AuthUser
}

export function requireRole(event: any, roles: Role[]) {
  const u = getAuthUser(event)
  if (!roles.includes(u.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return u
}
