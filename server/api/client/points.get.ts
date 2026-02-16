import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['CLIENT'])

  const client = await prisma.client.findFirst({ where: { email: u.email || '' } })
  if (!client) return { balance: 0, entries: [] }

  const [entries, totals] = await prisma.$transaction([
    prisma.loyaltyLedger.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    }),
    prisma.loyaltyLedger.aggregate({
      where: { clientId: client.id },
      _sum: { points: true }
    })
  ])

  const balance = totals._sum.points ?? 0

  return { balance, entries }
})
