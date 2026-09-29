import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { badRequest, forbidden } from '~/server/utils/errors'
import { z } from 'zod'
import { getAllowedBranchIds } from '~/server/utils/branchAccess'

const workingHourSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().refine((val) => /^\d{2}:\d{2}$/.test(val), { message: 'Must be HH:mm format' }),
  endTime: z.string().refine((val) => /^\d{2}:\d{2}$/.test(val), { message: 'Must be HH:mm format' }),
  isWorking: z.boolean().default(true)
})

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['OWNER', 'ADMIN', 'MANAGER', 'BARBER'])

  const method = event.method

  async function assertCanAccessUserHours(userId: string) {
    if (u.role === 'BARBER') {
      if (userId !== u.userId) forbidden('Forbidden')
      return
    }

    const allowedBranchIds = await getAllowedBranchIds(u)
    if (!allowedBranchIds) return
    if (!allowedBranchIds.length) forbidden('Forbidden')

    const assignment = await prisma.userBranch.findFirst({
      where: {
        userId,
        branchId: { in: allowedBranchIds }
      },
      select: { userId: true }
    })
    if (!assignment) forbidden('Forbidden')
  }

  if (method === 'GET') {
    const userId = (getQuery(event).userId as string) || undefined
    if (!userId) {
      badRequest('userId query param is required')
    }
    await assertCanAccessUserHours(userId)

    const hours = await prisma.barberWorkingHour.findMany({
      where: { userId },
      orderBy: { dayOfWeek: 'asc' }
    })

    return hours
  }

  if (method === 'POST' || method === 'PATCH') {
    const userId = (getQuery(event).userId as string) || undefined
    if (!userId) {
      badRequest('userId query param is required')
    }
    await assertCanAccessUserHours(userId)

    const body = await readBody(event)
    const parsed = workingHourSchema.parse(body)

    const [startHour = 0, startMinute = 0] = parsed.startTime.split(':').map(Number)
    const [endHour = 0, endMinute = 0] = parsed.endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
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
    const userId = (getQuery(event).userId as string) || undefined
    const dayOfWeek = (getQuery(event).dayOfWeek as string) || undefined
    
    if (!userId || dayOfWeek === undefined) {
      badRequest('userId and dayOfWeek query params are required')
    }
    await assertCanAccessUserHours(userId)

    await prisma.barberWorkingHour.deleteMany({
      where: {
        userId,
        dayOfWeek: parseInt(dayOfWeek)
      }
    })

    return { success: true }
  }

  return { error: 'Method not allowed' }
})
