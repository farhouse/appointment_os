import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { requireQueryString } from '~/server/utils/http'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  const q = getQuery(event)
  const branchId = requireQueryString(event, 'branchId')
  const from = q.from
  const to = q.to

  const where: any = { branchId }
  if (from && typeof from === 'string') where.createdAt = { ...(where.createdAt||{}), gte: new Date(from) }
  if (to && typeof to === 'string') where.createdAt = { ...(where.createdAt||{}), lte: new Date(to) }

  return prisma.sale.findMany({ where, include: { items: true } })
})
