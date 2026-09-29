import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import bcrypt from 'bcrypt'

import { publicClientRegisterSchema } from '~/server/utils/schemas'
import { readBodyValidated } from '~/server/utils/http'
import { badRequest } from '~/server/utils/errors'
import { signAccessToken, setAuthCookie } from '~/server/utils/auth'

// Public endpoint: create a CLIENT user account (opt-in from booking).
export default defineEventHandler(async (event) => {
  const data = await readBodyValidated(event, publicClientRegisterSchema)

  const email = data.email.trim().toLowerCase()
  const phone = (data.phone || '').trim() || null

  // Ensure no existing user
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) badRequest('User already exists')

  const hashedPassword = await bcrypt.hash(data.password, 10)

  const name = `${data.firstName} ${data.lastName || ''}`.trim()

  const client = await prisma.client.upsert({
    where: { email },
    create: {
      firstName: data.firstName,
      lastName: data.lastName || null,
      email,
      phone
    },
    update: {
      phone: phone || undefined
    },
    select: { id: true }
  })

  const user = await prisma.user.create({
    data: {
      email,
      phone,
      name,
      role: 'CLIENT',
      active: true,
      password: hashedPassword,
      clientId: client.id
    },
    select: { id: true, email: true, role: true, clientId: true }
  })

  // Auto-login
  const accessToken = signAccessToken({ userId: user.id, role: user.role as any, email: user.email })
  setAuthCookie(event, accessToken)

  return { user }
})
