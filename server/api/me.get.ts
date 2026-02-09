import { defineEventHandler, getCookie, createError } from 'h3'
import jwt from 'jsonwebtoken'
import prisma from '~/server/utils/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true, // This should exist now
      }
    })

    if (!user || !user.active) {
       throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    return { user }
  } catch (err) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid token',
    })
  }
})
