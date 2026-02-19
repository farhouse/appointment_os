import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireQueryString } from '~/server/utils/http'

// Returns busy slots for a local day; caller can compute availability.
export default defineEventHandler(async (event) => {
  const branchId = requireQueryString(event, 'branchId')
  const barberId = requireQueryString(event, 'barberId')
  const date = requireQueryString(event, 'date') // YYYY-MM-DD (local)

  // Use LOCAL day boundaries (not UTC) to avoid shifting days in America/Argentina/Buenos_Aires.
  const dayStart = new Date(`${date}T00:00:00.000`)
  const dayEnd = new Date(`${date}T23:59:59.999`)

  const appts = await prisma.appointment.findMany({
    where: {
      branchId,
      professionalId: barberId,
      // Overlap logic: appointment intersects [dayStart, dayEnd]
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
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
