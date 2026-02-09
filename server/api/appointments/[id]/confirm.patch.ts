import { defineEventHandler, getRouterParam, createError } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  // We need the user who is confirming. Middleware should attach user to context.
  // Assuming middleware puts user in event.context.user
  const user = event.context.user

  if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedById: user.id
    }
  })

  return appointment
})
