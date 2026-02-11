import { defineEventHandler, getRouterParam, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])
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
