import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

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

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Error', data: parsed.error.issues })
  }

  // MVP: create Sale + SaleItems. No split payments by design.
  const sale = await prisma.sale.create({
    data: {
      branchId: parsed.data.branchId,
      clientId: parsed.data.clientId ?? null,
      userId: parsed.data.userId ?? null,
      total: parsed.data.total as any,
      paymentMethod: parsed.data.paymentMethod as any,
      items: {
        create: parsed.data.items.map(i => ({
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
