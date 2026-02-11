import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { z } from 'zod'
import { getAuthUser, requireRole } from '~/server/utils/permissions'

const moveSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  professionalId: z.string().uuid().optional()
})

export default defineEventHandler(async (event) => {
  const u = getAuthUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id required' })
  }
  const body = await readBody(event)
  const validation = moveSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: validation.error.issues,
    })
  }

  if (u.role === 'BARBER') {
    // Barbers cannot move appointments (time/professional changes).
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  // Managers/admins only.
  requireRole(event, ['ADMIN', 'MANAGER'])

  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: validation.data
    })
    return appointment
  } catch (e) {
    throw createError({ statusCode: 404, statusMessage: 'Appointment not found' })
  }
})
