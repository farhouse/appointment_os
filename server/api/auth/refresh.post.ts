import { defineEventHandler, readBody, createError, setCookie } from 'h3'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const refreshToken = body?.refreshToken

  if (!refreshToken || typeof refreshToken !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'refreshToken required' })
  }

  try {
    const decoded: any = jwt.verify(refreshToken, JWT_REFRESH_SECRET)
    const accessToken = jwt.sign(
      { userId: decoded.userId, role: decoded.role, email: decoded.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    )

    setCookie(event, 'auth_token', accessToken, { httpOnly: true, maxAge: 3600 })
    return { accessToken }
  } catch (e) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid refresh token' })
  }
})
