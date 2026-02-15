import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { z } from 'zod'
import { getAuthUser } from '~/server/utils/permissions'
import { readBodyValidated, requireParam } from '~/server/utils/http'
import { forbidden, notFound } from '~/server/utils/errors'

const statusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'FINISHED', 'PAID', 'CANCELED', 'NO_SHOW'])
})

export default defineEventHandler(async (event) => {
  const u = getAuthUser(event)
  const id = requireParam(event, 'id')
  const validation = await readBodyValidated(event, statusSchema)

  // Only manager roles can update status.
  if (u.role !== 'OWNER' && u.role !== 'ADMIN' && u.role !== 'MANAGER') {
    forbidden('Forbidden')
  }

  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: validation.status,
        ...(validation.status === 'PAID'
          ? { paidAt: new Date(), paidById: u.userId }
          : {})
      }
    })
    return appointment
  } catch (e) {
    notFound('Appointment not found')
  }
})
