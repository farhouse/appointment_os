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
    const userId = (getQuery(event).userId as string) | undefined
    if (!userId) {
      badRequest('userId query param is required')
    }

    const hours = await prisma.barberWorkingHour.findMany({
      where: { userId },
      orderBy: { dayOfWeek: 'asc' }
    })

    return hours
  }

  if (method === 'POST' || method === 'PATCH') {
    const userId = (getQuery(event).userId as string) | undefined
    if (!userId) {
      badRequest('userId query param is required')
    }

    const body = await readBody(event)
    const parsed = workingHourSchema.parse(body)

    const startParts = parsed.startTime.split(':')
    const endParts = parsed.endTime.split(':')
    const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1])
    const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1])
    if (endMinutes <= startMinutes) {
      badRequest('endTime must be after startTime')
    }

    const hours = await prisma.barberWorkingHour.upsert({
      where: {
        userId_dayOfWeek: {
          userId,
          dayOfWeek: parsed.dayOfWeek
        }
      },
      update: {
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        isWorking: parsed.isWorking
      },
      create: {
        userId,
        dayOfWeek: parsed.dayOfWeek,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        isWorking: parsed.isWorking
      }
    })

    return hours
  }

  if (method === 'DELETE') {
    const userId = (getQuery(event).userId as string) | undefined
    const dayOfWeek = (getQuery(event).dayOfWeek as string) | undefined
    
    if (!userId || dayOfWeek === undefined) {
      badRequest('userId and dayOfWeek query params are required')
    }

    await prisma.barberWorkingHour.delete({
      where: {
        userId_dayOfWeek: {
          userId,
          dayOfWeek: parseInt(dayOfWeek)
        }
      }
    })

    return { success: true }
  }

  return { error: 'Method not allowed' }
})
