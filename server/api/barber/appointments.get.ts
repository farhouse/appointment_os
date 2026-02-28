import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { badRequest } from '~/server/utils/errors'

const rangePresets = new Set(['week', 'month'])

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['BARBER'])

  const query = getQuery(event)
  const range = String(query.range || 'week')
  if (!rangePresets.has(range)) badRequest('Invalid range')

  const start = query.start ? new Date(String(query.start)) : null
  const end = query.end ? new Date(String(query.end)) : null
  const status = query.status ? String(query.status) : undefined

  let startDate = start
  let endDate = end

  if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(startOfDay)
    if (range === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    } else {
      const day = startOfDay.getDay()
      const diffToMonday = (day + 6) % 7
      startDate = new Date(startOfDay)
      startDate.setDate(startDate.getDate() - diffToMonday)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
    }
  }

  return prisma.appointment.findMany({
    where: {
      professionalId: u.userId,
      ...(status ? { status: status as any } : {}),
      startTime: { gte: startDate },
      endTime: { lte: endDate }
    },
    include: {
      branch: true,
      client: true,
      services: { include: { service: true } }
    },
    orderBy: { startTime: 'asc' }
  })
})
