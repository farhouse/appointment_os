import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { appointmentSchema } from '~/server/utils/schemas'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { badRequest } from '~/server/utils/errors'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])
  const { serviceIds, ...data } = await readBodyValidated(event, appointmentSchema)

  // Fetch services to get current price and duration
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } }
  })

  if (services.length !== serviceIds.length) {
    badRequest('One or more services not found')
  }

  const appointment = await prisma.appointment.create({
    data: {
      ...data,
      status: 'PENDING',
      services: {
        create: services.map(s => ({
          serviceId: s.id,
          price: s.price,
          duration: s.duration
        }))
      }
    },
    include: {
      services: true
    }
  })

  return appointment
})
