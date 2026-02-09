import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { z } from 'zod'

const statusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'FINISHED', 'CANCELED', 'NO_SHOW'])
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const validation = statusSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: validation.error.issues,
    })
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: validation.data.status }
  })

  return appointment
})
