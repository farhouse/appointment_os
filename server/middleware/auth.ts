import { defineEventHandler, getCookie, createError } from 'h3'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key'

// Paths that don't require auth
const PUBLIC_PATHS = [
    '/api/auth/login', 
    '/api/auth/refresh',
    '/api/public'
]

export default defineEventHandler(async (event) => {
    const path = event.path

    if (PUBLIC_PATHS.some(p => path.startsWith(p))) {
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
        const decoded = jwt.verify(token, JWT_SECRET)
        event.context.user = decoded
    } catch (e) {
        throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
    }
})
