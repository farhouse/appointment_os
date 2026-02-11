import { defineEventHandler, readBody, createError, setCookie } from 'h3'
import prisma from '~/server/utils/prisma'
import { loginSchema } from '~/server/utils/schemas'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validation = loginSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: validation.error.issues,
    })
  }

  const { email, password } = validation.data

  const user = await prisma.user.findUnique({
    where: { email },
  })

  // 'active' field is guaranteed by new schema
  if (!user || !user.active) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    })
  }

  const validPassword = await bcrypt.compare(password, user.password)

  if (!validPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    })
  }

  // Generate tokens
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  )
  
  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )

  // In a real app, store refresh token in HttpOnly cookie
  setCookie(event, 'auth_token', accessToken, { httpOnly: true, maxAge: 3600 })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }
  }
})
