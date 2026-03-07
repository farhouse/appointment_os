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

const MOVE_BLOCK_MINUTES = 10

function snapToBlock(date: Date, blockMinutes = MOVE_BLOCK_MINUTES): Date {
  const ms = blockMinutes * 60 * 1000
  const snapped = Math.round(date.getTime() / ms) * ms
  return new Date(snapped)
}

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

  const rawStart = new Date(validation.startTime)
  const rawEnd = new Date(validation.endTime)
  if (!Number.isFinite(rawStart.getTime()) || !Number.isFinite(rawEnd.getTime())) {
    badRequest('Invalid startTime/endTime')
  }

  const durationMs = rawEnd.getTime() - rawStart.getTime()
  if (durationMs <= 0) {
    badRequest('endTime must be after startTime')
  }

  const start = snapToBlock(rawStart)
  const end = new Date(start.getTime() + durationMs)

  // Fetch current appointment to get branchId and current professionalId
  const currentAppointment = await prisma.appointment.findUnique({
    where: { id },
    select: { branchId: true, professionalId: true }
  })
  if (!currentAppointment) {
    notFound('Appointment not found')
  }

  const professionalId = validation.professionalId || currentAppointment.professionalId
  const branchId = currentAppointment.branchId

  // Check for overlapping appointments if professional is assigned
  if (professionalId) {
    const overlapping = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        professionalId,
        branchId,
        status: { notIn: ['CANCELED', 'NO_SHOW'] },
        startTime: { lt: end },
        endTime: { gt: start }
      }
    })
    if (overlapping) {
      badRequest('Appointment overlaps with an existing appointment for this professional')
    }
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      startTime: start,
      endTime: end,
      ...(validation.professionalId ? { professionalId: validation.professionalId } : {})
    }
  })
  return appointment
})
