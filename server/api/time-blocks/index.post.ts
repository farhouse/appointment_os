import { z } from 'zod'
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '~/server/utils/prisma'

const createSchema = z.object({
  branchId: z.string().uuid(),
  professionalId: z.string().uuid().optional().nullable(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  allDay: z.boolean().optional(),
  reason: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody(event)
  const result = createSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.format()
    })
  }

  const { branchId, professionalId, startTime, endTime, allDay, reason } = result.data

  // Authorization Check
  if (user.role === 'BARBER') {
    // Barbers can only create blocks for themselves
    if (professionalId && professionalId !== user.userId) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden: Can only block own time' })
    }
    if (!professionalId) {
       throw createError({ statusCode: 403, statusMessage: 'Forbidden: Cannot create branch-wide blocks' })
    }
  } else if (['MANAGER', 'ADMIN', 'OWNER'].includes(user.role)) {
    // Allowed
  } else {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  
  const timeBlock = await prisma.timeBlock.create({
    data: {
      branchId,
      professionalId: professionalId || null,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      allDay: allDay || false,
      reason,
      createdById: user.userId
    }
  })

  return timeBlock
})
