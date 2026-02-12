import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { z } from 'zod'
import { getAuthUser } from '~/server/utils/permissions'
import { readBodyValidated, requireParam } from '~/server/utils/http'
import { forbidden, notFound } from '~/server/utils/errors'

const statusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'FINISHED', 'CANCELED', 'NO_SHOW'])
})

export default defineEventHandler(async (event) => {
  const u = getAuthUser(event)
  const id = requireParam(event, 'id')
  const validation = await readBodyValidated(event, statusSchema)

  if (u.role === 'BARBER') {
    // Barbers can only update status for their own appointments.
    const appt = await prisma.appointment.findUnique({ where: { id }, select: { professionalId: true } })
    if (!appt) {
      notFound('Appointment not found')
    }
    if (!appt.professionalId) {
      forbidden('Forbidden')
    }
    if (appt.professionalId !== u.userId) {
      forbidden('Forbidden')
    }
  }

  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: validation.status }
    })
    return appointment
  } catch (e) {
    notFound('Appointment not found')
  }
})
