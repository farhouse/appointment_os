import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { z } from 'zod'
import { getAuthUser } from '~/server/utils/permissions'

const statusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'FINISHED', 'CANCELED', 'NO_SHOW'])
})

export default defineEventHandler(async (event) => {
  const u = getAuthUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id required' })
  }
  const body = await readBody(event)
  const validation = statusSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: validation.error.issues,
    })
  }

  if (u.role === 'BARBER') {
    // Barbers can only update status for their own appointments.
    const appt = await prisma.appointment.findUnique({ where: { id }, select: { professionalId: true } })
    if (!appt) {
      throw createError({ statusCode: 404, statusMessage: 'Appointment not found' })
    }
    if (!appt.professionalId) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
    if (appt.professionalId !== u.userId) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
  }

  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: validation.data.status }
    })
    return appointment
  } catch (e) {
    throw createError({ statusCode: 404, statusMessage: 'Appointment not found' })
  }
})
