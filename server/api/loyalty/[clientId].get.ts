import { defineEventHandler } from 'h3'

import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { requireParam } from '~/server/utils/http'
import { requireClientAccess } from '~/server/utils/branchAccess'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const clientId = requireParam(event, 'clientId')
  await requireClientAccess(user, clientId)
  const rows = await prisma.loyaltyLedger.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' } })
  const saldo = rows.reduce((acc, r) => acc + r.points, 0)
  return { clientId, saldo, movimientos: rows }
})
