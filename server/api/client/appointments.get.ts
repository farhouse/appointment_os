import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { notFound } from '~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['CLIENT'])

  const client = await prisma.client.findFirst({ where: { email: u.email || '' } })
  if (!client) notFound('Client profile not found')

  return prisma.appointment.findMany({
    where: { clientId: client.id },
    include: {
      branch: true,
      professional: { select: { id: true, name: true } },
      services: { include: { service: { select: { id: true, name: true } } } }
    },
    orderBy: { startTime: 'desc' }
  })
})
