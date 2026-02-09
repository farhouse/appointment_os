import { getQuery, createError } from 'h3'
import prisma from '~/server/utils/prisma'

// MVP stub: returns busy slots for a day; caller can compute availability.
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const branchId = q.branchId
  const barberId = q.barberId
  const date = q.date

  if (!branchId || typeof branchId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'branchId required' })
  }
  if (!barberId || typeof barberId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'barberId required' })
  }
  if (!date || typeof date !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'date required (YYYY-MM-DD)' })
  }

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
