import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/permissions'
import { badRequest, forbidden } from '~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const u = getAuthUser(event)
  const query = getQuery(event)
  const start = query.start ? new Date(query.start as string) : undefined
  const end = query.end ? new Date(query.end as string) : undefined
  const branchId = query.branchId as string | undefined
  const professionalId = query.professionalId as string | undefined

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    badRequest('start and end query params are required (ISO date)')
  }

  if (u.role === 'BARBER') {
    // Barbers can only read their own calendar.
    if (professionalId && professionalId !== u.userId) {
      forbidden('Forbidden')
    }
  }

  const whereClause: any = {
    startTime: { gte: start },
    endTime: { lte: end },
  }

  if (branchId) whereClause.branchId = branchId
  if (professionalId) whereClause.professionalId = professionalId
  if (u.role === 'BARBER') whereClause.professionalId = u.userId

  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    include: {
      client: {
        select: { id: true, firstName: true, lastName: true, phone: true, email: true }
      },
      professional: {
        select: { id: true, name: true }
      },
      services: {
        select: {
          price: true,
          service: { select: { id: true, name: true } }
        }
      }
    }
  })

  // Format for VueCal/FullCalendar-like events.
  return appointments.map(apt => {
    const totalPrice = apt.services.reduce((sum, service) => sum + Number(service.price), 0)
    return {
    id: apt.id,
    title: `${apt.client.firstName} ${apt.client.lastName || ''} - ${apt.services.map(s => s.service.name).join(', ')}`,
    start: apt.startTime,
    end: apt.endTime,
    extendedProps: {
      status: apt.status,
      notes: apt.notes,
      totalPrice,
      client: {
        id: apt.client.id,
        firstName: apt.client.firstName,
        lastName: apt.client.lastName,
        phone: apt.client.phone,
        email: apt.client.email
      },
      professional: apt.professional ? { id: apt.professional.id, name: apt.professional.name } : null,
      services: apt.services.map(s => ({ id: s.service.id, name: s.service.name, price: s.price }))
    },
    classNames: [`status-${apt.status.toLowerCase()}`]
    }
  })
})
