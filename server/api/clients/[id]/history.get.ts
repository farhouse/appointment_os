import { defineEventHandler, getRouterParam, createError } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const appointments = await prisma.appointment.findMany({
    where: { clientId: id },
    include: {
        services: {
            include: {
                service: true
            }
        },
        professional: {
            select: { name: true }
        }
    },
    orderBy: { startTime: 'desc' }
  })

  return appointments
})
