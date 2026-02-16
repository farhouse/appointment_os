import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const redeemable = q.redeemable === 'true'

  const where: any = {}
  if (redeemable) where.pointsCost = { gt: 0 }

  return prisma.product.findMany({
    where,
    orderBy: { name: 'asc' },
    select: { id: true, name: true, sku: true, description: true, pointsCost: true } as any
  })
})
