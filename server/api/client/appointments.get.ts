import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const u = getAuthUser(event)

  const client = await prisma.client.findFirst({ where: { email: u.email || '' } })
  if (!client) return []

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
