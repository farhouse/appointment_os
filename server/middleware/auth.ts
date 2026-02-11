import { defineEventHandler } from 'h3'

import { getAuthCookie, verifyAccessToken } from '~/server/utils/auth'
import { unauthorized } from '~/server/utils/errors'

// Paths that don't require auth
const PUBLIC_PREFIXES = ['/api/public/']
const PUBLIC_EXACT = new Set(['/api/auth/login', '/api/auth/refresh', '/api/auth/logout'])

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

  event.context.user = verifyAccessToken(token)
})
