import { defineEventHandler } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'

const schema = z.object({
  branchId: z.string().uuid(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  reference: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive()
  })).min(1)
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  const parsed = await readBodyValidated(event, schema)

  // MVP: create movement + items (no stock math yet)
  const movement = await prisma.stockMovement.create({
    data: {
      branchId: parsed.branchId,
      type: parsed.type as any,
      reference: parsed.reference ?? null,
      items: {
        create: parsed.items.map(i => ({ productId: i.productId, quantity: i.quantity }))
      }
    },
    include: { items: true }
  })

  return movement
})
