import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

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

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Error', data: parsed.error.issues })
  }

  // MVP: create movement + items (no stock math yet)
  const movement = await prisma.stockMovement.create({
    data: {
      branchId: parsed.data.branchId,
      type: parsed.data.type as any,
      reference: parsed.data.reference ?? null,
      items: {
        create: parsed.data.items.map(i => ({ productId: i.productId, quantity: i.quantity }))
      }
    },
    include: { items: true }
  })

  return movement
})
