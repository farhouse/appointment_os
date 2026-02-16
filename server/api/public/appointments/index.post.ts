import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { appointmentSchema } from '~/server/utils/schemas'
import { readBodyValidated } from '~/server/utils/http'
import { badRequest } from '~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const { serviceIds, ...data } = await readBodyValidated(event, appointmentSchema)

  // Prevent creating appointments in the past (client booking)
  const start = new Date(data.startTime)
  const end = new Date(data.endTime)
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    badRequest('Invalid startTime/endTime')
  }
  if (end <= start) {
    badRequest('endTime must be after startTime')
  }
  const now = new Date()
  // Small grace to avoid edge cases with clock skew
  const graceMs = 60 * 1000
  if (start.getTime() < now.getTime() - graceMs) {
    badRequest('Cannot book appointments in the past')
  }

  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } }
  })

  if (services.length !== serviceIds.length) {
    badRequest('One or more services not found')
  }

  // Public appointment creation always starts as PENDING
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
