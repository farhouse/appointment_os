import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const query = getQuery(event)
  const branchId = query.branchId as string | undefined
  const cashBoxId = query.cashBoxId as string | undefined

  return prisma.cashSession.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      ...(cashBoxId ? { cashBoxId } : {})
    },
    include: { movements: true, cashBox: true },
    orderBy: { date: 'desc' }
  })
})
