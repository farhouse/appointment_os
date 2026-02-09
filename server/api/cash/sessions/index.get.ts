import { getQuery, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  const q = getQuery(event)
  const branchId = q.branchId
  if (!branchId || typeof branchId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'branchId required' })
  }

  return prisma.cashSession.findMany({
    where: { branchId },
    include: { movements: true },
    orderBy: { date: 'desc' }
  })
})
