import { defineEventHandler, getRouterParam } from 'h3'

import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/permissions'
import { forbidden } from '~/server/utils/errors'

// Returns last 3 appointments for a client.
// BARBER can only access if the client has at least one appointment assigned to them.
export default defineEventHandler(async (event) => {
  const u = getAuthUser(event)
  const clientId = getRouterParam(event, 'id')

  if (u.role !== 'OWNER' && u.role !== 'ADMIN' && u.role !== 'MANAGER' && u.role !== 'BARBER') {
    forbidden('Forbidden')
  }

  if (u.role === 'BARBER') {
    const canSee = await prisma.appointment.findFirst({
      where: { clientId, professionalId: u.userId },
      select: { id: true }
    })
    if (!canSee) forbidden('Forbidden')
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      clientId,
      status: { in: ['PAID', 'FINISHED'] }
    },
    include: {
      services: { include: { service: { select: { name: true } } } },
      professional: { select: { name: true } }
    },
    orderBy: { startTime: 'desc' },
    take: 3
  })

  return appointments.map(a => ({
    id: a.id,
    startTime: a.startTime,
    status: a.status,
    professionalName: a.professional?.name || null,
    services: a.services.map(s => s.service.name)
  }))
})
