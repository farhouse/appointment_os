import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { appointmentSchema } from '~/server/utils/schemas'
import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])
  const body = await readBody(event)
  const validation = appointmentSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: validation.error.issues,
    })
  }

  const { serviceIds, ...data } = validation.data

  // Fetch services to get current price and duration
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } }
  })

  if (services.length !== serviceIds.length) {
    throw createError({
        statusCode: 400,
        statusMessage: 'One or more services not found'
    })
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
