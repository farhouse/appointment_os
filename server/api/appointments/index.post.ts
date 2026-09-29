import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { appointmentSchema } from '~/server/utils/schemas'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { badRequest } from '~/server/utils/errors'
import { requireBranchAccess } from '~/server/utils/branchAccess'

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])
  const { serviceIds, ...data } = await readBodyValidated(event, appointmentSchema)
  await requireBranchAccess(u, data.branchId)

  // Check for overlapping appointments if professional is assigned
  if (data.professionalId) {
    const overlapping = await prisma.appointment.findFirst({
      where: {
        professionalId: data.professionalId,
        branchId: data.branchId,
        status: { notIn: ['CANCELED', 'NO_SHOW'] },
        startTime: { lt: new Date(data.endTime) },
        endTime: { gt: new Date(data.startTime) }
      }
    })
    if (overlapping) {
      badRequest('Appointment overlaps with an existing appointment for this professional')
    }
  }

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
      status: data.status || 'PENDING',
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
