import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { badRequest } from '~/server/utils/errors'

// Public helper endpoint: check if a CLIENT user exists by email.
export default defineEventHandler(async (event) => {
  const { email } = getQuery(event) as { email?: string }
  const e = (email || '').trim()
  if (!e) badRequest('email required')

  const user = await prisma.user.findFirst({
    where: {
      email: e,
      role: 'CLIENT',
      active: true
    },
    select: { id: true, name: true, email: true }
  })

  return { exists: !!user, user }
})
