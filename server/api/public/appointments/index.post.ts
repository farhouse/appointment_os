import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { appointmentSchema } from '~/server/utils/schemas'

export default defineEventHandler(async (event) => {
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

  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } }
  })

  // Public booking always creates PENDING
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
    }
  })

  return appointment
})
