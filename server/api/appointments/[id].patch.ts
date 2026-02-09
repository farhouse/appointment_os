import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { appointmentUpdateSchema } from '~/server/utils/schemas'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const validation = appointmentUpdateSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: validation.error.issues,
    })
  }

  // Handle service updates if present (complex logic, minimal impl here)
  // For MVP v1.1 just updating scalars
  // If services need update, we'd need to delete old relations and add new ones.
  // Skipping deep service update logic for this skeleton unless needed.

  const appointment = await prisma.appointment.update({
    where: { id },
    data: validation.data
  })

  return appointment
})
