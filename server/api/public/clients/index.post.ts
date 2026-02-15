import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { clientSchema } from '~/server/utils/schemas'
import { readBodyValidated } from '~/server/utils/http'
import { badRequest } from '~/server/utils/errors'

// Public endpoint to create (or reuse) a client record for booking.
// Note: for public booking flow we require a phone.
export default defineEventHandler(async (event) => {
  const data = await readBodyValidated(event, clientSchema)

  const email = (data.email || '').trim() || null
  const phone = (data.phone || '').trim() || null

  if (!phone) badRequest('phone required')

  // Try to reuse an existing client (avoid unique constraint errors).
  let existing = null as any
  if (email) {
    existing = await prisma.client.findUnique({ where: { email }, select: { id: true, firstName: true, lastName: true, email: true, phone: true } })
  }
  if (!existing && phone) {
    existing = await prisma.client.findUnique({ where: { phone }, select: { id: true, firstName: true, lastName: true, email: true, phone: true } })
  }
  if (existing) return existing

  return prisma.client.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName || null,
      email,
      phone,
      notes: data.notes || null
    },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true }
  })
})
