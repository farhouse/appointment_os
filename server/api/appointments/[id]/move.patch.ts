import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { z } from 'zod'
import { getAuthUser, requireRole } from '~/server/utils/permissions'
import { readBodyValidated, requireParam } from '~/server/utils/http'
import { badRequest, forbidden, notFound } from '~/server/utils/errors'

const moveSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  professionalId: z.string().uuid().optional()
})

export default defineEventHandler(async (event) => {
  const u = getAuthUser(event)
  const id = requireParam(event, 'id')
  const validation = await readBodyValidated(event, moveSchema)

  if (u.role === 'BARBER') {
    // Barbers cannot move appointments (time/professional changes).
    forbidden('Forbidden')
  }

  // Managers/admins/owners only.
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const start = new Date(validation.startTime)
  const end = new Date(validation.endTime)
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    badRequest('Invalid startTime/endTime')
  }
  if (end <= start) {
    badRequest('endTime must be after startTime')
  }

  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: validation
    })
    return appointment
  } catch (e) {
    notFound('Appointment not found')
  }
})
