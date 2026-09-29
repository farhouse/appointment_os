import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { badRequest } from '~/server/utils/errors'
import { z } from 'zod'

const workingHourSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().refine((val) => /^\d{2}:\d{2}$/.test(val), { message: 'Must be HH:mm format' }),
  endTime: z.string().refine((val) => /^\d{2}:\d{2}$/.test(val), { message: 'Must be HH:mm format' }),
  isWorking: z.boolean().default(true)
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const method = event.method

  if (method === 'GET') {
    const branchId = (getQuery(event).branchId as string) || undefined
    if (!branchId) {
      badRequest('branchId query param is required')
    }

    const hours = await prisma.branchWorkingHour.findMany({
      where: { branchId },
      orderBy: { dayOfWeek: 'asc' }
    })

    return hours
  }

  if (method === 'POST' || method === 'PATCH') {
    const branchId = (getQuery(event).branchId as string) || undefined
    if (!branchId) {
      badRequest('branchId query param is required')
    }

    const body = await readBody(event)
    const parsed = workingHourSchema.parse(body)

    const [startHour = 0, startMinute = 0] = parsed.startTime.split(':').map(Number)
    const [endHour = 0, endMinute = 0] = parsed.endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    if (endMinutes <= startMinutes) {
      badRequest('endTime must be after startTime')
    }

    const hours = await prisma.branchWorkingHour.upsert({
      where: {
        branchId_dayOfWeek: {
          branchId,
          dayOfWeek: parsed.dayOfWeek
        }
      },
      update: {
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        isWorking: parsed.isWorking
      },
      create: {
        branchId,
        dayOfWeek: parsed.dayOfWeek,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        isWorking: parsed.isWorking
      }
    })

    return hours
  }

  if (method === 'DELETE') {
    const branchId = (getQuery(event).branchId as string) || undefined
    const dayOfWeek = (getQuery(event).dayOfWeek as string) || undefined
    
    if (!branchId || dayOfWeek === undefined) {
      badRequest('branchId and dayOfWeek query params are required')
    }

    await prisma.branchWorkingHour.deleteMany({
      where: {
        branchId,
        dayOfWeek: parseInt(dayOfWeek)
      }
    })

    return { success: true }
  }

  return { error: 'Method not allowed' }
})
