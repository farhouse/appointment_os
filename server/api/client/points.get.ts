import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { resolveClientProfile } from '~/server/utils/clientProfile'

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['CLIENT'])

  const client = await resolveClientProfile(u)

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
