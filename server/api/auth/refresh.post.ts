import { defineEventHandler } from 'h3'
import { z } from 'zod'

import prisma from '~/server/utils/prisma'
import { signAccessToken, setAuthCookie, verifyRefreshToken } from '~/server/utils/auth'
import { readBodyValidated } from '~/server/utils/http'
import { unauthorized } from '~/server/utils/errors'

const schema = z.object({ refreshToken: z.string().min(1) })

export default defineEventHandler(async (event) => {
  const { refreshToken } = await readBodyValidated(event, schema)
  const decoded = verifyRefreshToken(refreshToken)

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true, email: true, active: true },
  })

  if (!user || !user.active) {
    unauthorized('Unauthorized')
  }

  // Role/email are not carried in refresh token; we fetch them to issue a usable access token.
  const accessToken = signAccessToken({ userId: user.id, role: user.role, email: user.email })

  setAuthCookie(event, accessToken)
  return { accessToken }
})
