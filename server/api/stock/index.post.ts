import { defineEventHandler } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'

const schema = z.object({
  branchId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().min(0),
  minStock: z.number().int().min(0).optional().nullable()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const parsed = await readBodyValidated(event, schema)

  return prisma.branchStock.upsert({
    where: { branchId_productId: { branchId: parsed.branchId, productId: parsed.productId } },
    update: {
      quantity: parsed.quantity,
      minStock: parsed.minStock ?? undefined
    },
    create: {
      branchId: parsed.branchId,
      productId: parsed.productId,
      quantity: parsed.quantity,
      minStock: parsed.minStock ?? 0
    },
    include: { product: true, branch: true }
  })
})
