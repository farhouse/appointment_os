import { defineEventHandler } from 'h3'

import { getAuthCookie, verifyAccessToken } from '~/server/utils/auth'
import { unauthorized } from '~/server/utils/errors'
import prisma from '~/server/utils/prisma'

// Paths that don't require auth
const PUBLIC_PREFIXES = ['/api/public/']
const PUBLIC_EXACT = new Set([
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/setup/status',
  '/api/setup/init',
])

export default defineEventHandler(async (event) => {
  const path = event.path

  if (PUBLIC_EXACT.has(path) || PUBLIC_PREFIXES.some(p => path.startsWith(p))) {
    return
  }

  // Only protect /api routes, ignore frontend routes handled by Nuxt pages logic or let them fail gracefully
  if (!path.startsWith('/api')) {
    return
  }

  const token = getAuthCookie(event)

  if (!token) {
    unauthorized('Unauthorized')
  }

  // Verify signature + shape first, then re-load from DB to:
  // - enforce `active` immediately (no 1h window)
  // - avoid stale role/email in long-lived tabs
  const decoded = verifyAccessToken(token)

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true, email: true, active: true },
  })

  if (!user || !user.active) {
    unauthorized('Unauthorized')
  }

  event.context.user = { userId: user.id, role: user.role, email: user.email }
})
