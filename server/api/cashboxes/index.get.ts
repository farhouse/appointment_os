import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  const q = getQuery(event)
  const branchId = typeof q.branchId === 'string' && q.branchId.length ? q.branchId : null

  return prisma.cashBox.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      active: true
    },
    orderBy: [{ branchId: 'asc' }, { name: 'asc' }],
    include: {
      branch: { select: { id: true, name: true } }
    }
  })
})
