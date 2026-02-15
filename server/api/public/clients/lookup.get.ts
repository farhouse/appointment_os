import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { badRequest } from '~/server/utils/errors'

// Public helper endpoint: check if a client already exists by email or phone.
export default defineEventHandler(async (event) => {
  const { email, phone } = getQuery(event) as { email?: string; phone?: string }

  const e = (email || '').trim() || null
  const p = (phone || '').trim() || null

  // Enforce at least one param.
  if (!e && !p) badRequest('email or phone required')

  const client = await prisma.client.findFirst({
    where: {
      OR: [
        ...(e ? [{ email: e }] : []),
        ...(p ? [{ phone: p }] : [])
      ]
    },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true }
  })

  return {
    exists: !!client,
    client
  }
})
