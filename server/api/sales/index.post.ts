import { defineEventHandler } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { badRequest } from '~/server/utils/errors'

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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const openSession = await prisma.cashSession.findFirst({
    where: {
      branchId: parsed.branchId,
      closingTime: null
    }
  })

  if (!openSession) {
    badRequest('Open cash session required')
  }

  // MVP: create Sale + SaleItems. No split payments by design.
  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
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

    await tx.cashMovement.create({
      data: {
        sessionId: openSession!.id,
        saleId: created.id,
        amount: parsed.total as any,
        type: 'DEPOSIT',
        paymentMethod: parsed.paymentMethod as any,
        reason: 'SALE'
      } as any
    })

    return created
  })

  return sale
})
