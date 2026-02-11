import { defineEventHandler, getRouterParam, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { getAuthUser, requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id required' })
  }
  // Only managers/admins can confirm appointments.
  requireRole(event, ['ADMIN', 'MANAGER'])
  const user = getAuthUser(event)

  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedById: user.userId
      }
    })
    return appointment
  } catch (e) {
    throw createError({ statusCode: 404, statusMessage: 'Appointment not found' })
  }
})
