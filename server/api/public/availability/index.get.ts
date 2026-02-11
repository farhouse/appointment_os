import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireQueryString } from '~/server/utils/http'

// MVP stub: returns busy slots for a day; caller can compute availability.
export default defineEventHandler(async (event) => {
  const branchId = requireQueryString(event, 'branchId')
  const barberId = requireQueryString(event, 'barberId')
  const date = requireQueryString(event, 'date')

  const dayStart = new Date(date + 'T00:00:00.000Z')
  const dayEnd = new Date(date + 'T23:59:59.999Z')

  const appts = await prisma.appointment.findMany({
    where: {
      branchId,
      professionalId: barberId,
      startTime: { gte: dayStart, lte: dayEnd },
      status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
    },
    select: { startTime: true, endTime: true, status: true }
  })

  return {
    branchId,
    barberId,
    date,
    busy: appts
  }
})
