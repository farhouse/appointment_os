import { defineEventHandler } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'

const schema = z.object({
  branchId: z.string().uuid(),
  clientId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'OTHER']),
  total: z.number().nonnegative(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().nonnegative()
  })).min(1)
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  const parsed = await readBodyValidated(event, schema)

  // MVP: create Sale + SaleItems. No split payments by design.
  const sale = await prisma.sale.create({
    data: {
      branchId: parsed.branchId,
      clientId: parsed.clientId ?? null,
      userId: parsed.userId ?? null,
      total: parsed.total as any,
      paymentMethod: parsed.paymentMethod as any,
      items: {
        create: parsed.items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price as any
        }))
      }
    },
    include: { items: true }
  })

  return sale
})
