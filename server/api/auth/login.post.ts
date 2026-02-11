import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { loginSchema } from '~/server/utils/schemas'
import bcrypt from 'bcrypt'

import { signAccessToken, signRefreshToken, setAuthCookie } from '~/server/utils/auth'
import { readBodyValidated } from '~/server/utils/http'
import { unauthorized } from '~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBodyValidated(event, loginSchema)

  const user = await prisma.user.findUnique({
    where: { email },
  })

  // 'active' field is guaranteed by new schema
  if (!user || !user.active) {
    unauthorized('Invalid credentials')
  }

  const validPassword = await bcrypt.compare(password, user.password)

  if (!validPassword) {
    unauthorized('Invalid credentials')
  }

  // Generate tokens
  const accessToken = signAccessToken({ userId: user.id, role: user.role, email: user.email })
  const refreshToken = signRefreshToken({ userId: user.id })

  setAuthCookie(event, accessToken)

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
