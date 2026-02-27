import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const clients = await prisma.client.findMany({
    include: {
      loyaltyLedger: { select: { points: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return clients.map((client) => ({
    ...client,
    pointsBalance: client.loyaltyLedger.reduce((acc, row) => acc + row.points, 0)
  }))
})
