import { defineEventHandler, readBody, createError, setCookie } from 'h3'
import jwt from 'jsonwebtoken'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw createError({ statusCode: 500, statusMessage: 'Server misconfigured' })
  }
  return secret
}

function getJwtRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET || getJwtSecret()
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const refreshToken = body?.refreshToken

  if (!refreshToken || typeof refreshToken !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'refreshToken required' })
  }

  try {
    const decoded: any = jwt.verify(refreshToken, getJwtRefreshSecret(), { algorithms: ['HS256'] })
    const accessToken = jwt.sign(
      // Role/email are not carried in refresh token; middleware will use access token for RBAC.
      { userId: decoded.userId },
      getJwtSecret(),
      { expiresIn: '1h' }
    )

    setCookie(event, 'auth_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 3600,
    })
    return { accessToken }
  } catch (e) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid refresh token' })
  }
})
