import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  const clientId = event.context.params?.clientId
  const rows = await prisma.loyaltyLedger.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' } })
  const saldo = rows.reduce((acc, r) => acc + r.points, 0)
  return { clientId, saldo, movimientos: rows }
})
