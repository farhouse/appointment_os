import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { badRequest } from '~/server/utils/errors'

// Public helper endpoint: check if a CLIENT user exists by email or phone.
export default defineEventHandler(async (event) => {
  const { email, phone } = getQuery(event) as { email?: string; phone?: string }
  const e = (email || '').trim() || null
  const p = (phone || '').trim() || null
  if (!e && !p) badRequest('email or phone required')

  const user = await prisma.user.findFirst({
    where: {
      role: 'CLIENT',
      active: true,
      OR: [
        ...(e ? [{ email: e }] : []),
        ...(p ? [{ phone: p }] : [])
      ]
    },
    select: { id: true, name: true, email: true, phone: true }
  })

  return { exists: !!user, user }
})
