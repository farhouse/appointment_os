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

  // Return events that overlap the requested interval.
  // (VueCal day/week views often send `end` as the start of the next day, so using `endTime <= end`
  // would incorrectly exclude same-day appointments.)
  const whereClause: any = {
    startTime: { lt: end },
    endTime: { gt: start },
  }

  if (branchId) whereClause.branchId = branchId
  if (professionalId) whereClause.professionalId = professionalId
  if (u.role === 'BARBER') whereClause.professionalId = u.userId

  const [appointments, blocks] = await Promise.all([
    prisma.appointment.findMany({
      where: whereClause,
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true }
        },
        professional: {
          select: { id: true, name: true }
        },
        branch: {
          select: { id: true, name: true }
        },
        services: {
          select: {
            price: true,
            service: { select: { id: true, name: true } }
          }
        },
        sale: {
          include: { items: true }
        }
      }
    }),
    prisma.timeBlock.findMany({
      where: whereClause, // Reuse same where logic? Mostly yes.
      include: {
        professional: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } }
      }
    })
  ])

  const mappedBlocks = blocks.map(block => ({
    id: block.id,
    title: block.reason || 'Bloqueado',
    start: block.startTime,
    end: block.endTime,
    ...(block.professionalId ? { schedule: block.professionalId } : {}),
    extendedProps: {
      type: 'BLOCK',
      id: block.id,
      reason: block.reason,
      allDay: block.allDay,
      professional: block.professional,
      branch: block.branch
    },
    class: 'block-event',
    classNames: ['block-event']
  }))

  // Format for VueCal/FullCalendar-like events.
  const mappedAppointments = appointments.map(apt => {
    const servicePrice = apt.services.reduce((sum, s) => sum + Number(s.price), 0)
    const salePrice = Number(apt.sale?.total || 0)
    const totalPrice = servicePrice + salePrice
    
    return {
      id: apt.id,
      title: `${apt.client.firstName} ${apt.client.lastName || ''} - ${apt.services.map(s => s.service.name).join(', ')}`,
      start: apt.startTime,
      end: apt.endTime,
      // VueCal schedules (columns): use the professional id as schedule id.
      ...(apt.professionalId ? { schedule: apt.professionalId } : {}),
      extendedProps: {
        type: 'APPOINTMENT',
        status: apt.status,
        notes: apt.notes,
        totalPrice,
        servicePrice,
        salePrice,
        sale: apt.sale,
        client: {
          id: apt.client.id,
          firstName: apt.client.firstName,
          lastName: apt.client.lastName,
          phone: apt.client.phone,
          email: apt.client.email
        },
        branch: apt.branch
          ? {
              id: apt.branch.id,
              name: apt.branch.name
            }
          : null,
        professional: apt.professional ? { id: apt.professional.id, name: apt.professional.name } : null,
        services: apt.services.map(s => ({ id: s.service.id, name: s.service.name, price: s.price }))
      },
      class: `status-${apt.status.toLowerCase()}`,
      classNames: [`status-${apt.status.toLowerCase()}`]
    }
  })

  return [...mappedAppointments, ...mappedBlocks]
})
