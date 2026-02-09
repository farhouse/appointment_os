import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { z } from 'zod'

const moveSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  professionalId: z.string().uuid().optional()
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const validation = moveSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: validation.error.issues,
    })
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: validation.data
  })

  // Trigger notifications if enabled? (Future)

  return appointment
})
