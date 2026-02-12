import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { getAuthCookie, verifyAccessToken } from '~/server/utils/auth'
import { unauthorized } from '~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const token = getAuthCookie(event)

  if (!token) {
    unauthorized('Unauthorized')
  }

  try {
    const decoded = verifyAccessToken(token)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true, // This should exist now
        branches: {
          select: {
            branchId: true
          }
        }
      }
    })

    if (!user || !user.active) {
      unauthorized('Unauthorized')
    }

    return { user }
  } catch (err) {
    unauthorized('Invalid token')
  }
})
