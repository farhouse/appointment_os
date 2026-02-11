import { defineEventHandler, getCookie, createError } from 'h3'
import jwt from 'jsonwebtoken'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw createError({ statusCode: 500, statusMessage: 'Server misconfigured' })
  }
  return secret
}

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

  const token = getCookie(event, 'auth_token')

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] })
    event.context.user = decoded
  } catch (e) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }
})
