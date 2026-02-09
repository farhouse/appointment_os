import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { startOfDay, endOfDay, parseISO } from 'date-fns'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const start = query.start ? new Date(query.start as string) : undefined
  const end = query.end ? new Date(query.end as string) : undefined
  const branchId = query.branchId as string | undefined
  const professionalId = query.professionalId as string | undefined

  const whereClause: any = {
      startTime: {
          gte: start,
          lte: end
      }
  }

  if (branchId) whereClause.branchId = branchId
  if (professionalId) whereClause.professionalId = professionalId

  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    include: {
      client: {
        select: { firstName: true, lastName: true }
      },
      professional: {
        select: { name: true }
      },
      services: {
        include: { service: { select: { name: true } } }
      }
    }
  })

  // Format for FullCalendar
  return appointments.map(apt => ({
    id: apt.id,
    title: `${apt.client.firstName} ${apt.client.lastName || ''} - ${apt.services.map(s => s.service.name).join(', ')}`,
    start: apt.startTime,
    end: apt.endTime,
    extendedProps: {
      status: apt.status,
      professionalName: apt.professional?.name,
      notes: apt.notes
    },
    // Color coding based on status could be done here or frontend
    classNames: [`status-${apt.status.toLowerCase()}`]
  }))
})
