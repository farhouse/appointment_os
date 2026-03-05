import { defineEventHandler } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { badRequest } from '~/server/utils/errors'
import { paymentMethodOrder, resolvePaymentMedium } from '~/server/utils/paymentMethods'

const schema = z.object({
  branchId: z.string().uuid(),
  clientId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  paymentMethod: z.enum(paymentMethodOrder),
  paymentMediumId: z.string().uuid().optional(),
  total: z.number().nonnegative(),
  items: z.array(z.object({
    productId: z.string().uuid().optional(),
    serviceId: z.string().uuid().optional(),
    name: z.string().min(1),
    quantity: z.number().int().positive(),
    price: z.number().nonnegative()
  })).min(1)
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  const parsed = await readBodyValidated(event, schema)

  const paymentMedium = await resolvePaymentMedium(prisma, parsed.paymentMethod, parsed.paymentMediumId)
  if (!paymentMedium) {
    badRequest('Payment medium disabled or invalid')
  }

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

  const sale = await prisma.$transaction(async (tx) => {
    // Aggregate required stock by product for this sale.
    const requiredByProduct = parsed.items.reduce<Record<string, number>>((acc, item) => {
      if (!item.productId) return acc
      acc[item.productId] = (acc[item.productId] || 0) + item.quantity
      return acc
    }, {})

    const productIds = Object.keys(requiredByProduct)

    if (productIds.length) {
      const branchStocks = await tx.branchStock.findMany({
        where: {
          branchId: parsed.branchId,
          productId: { in: productIds }
        },
        select: {
          productId: true,
          quantity: true
        }
      })

      const stockByProduct = new Map(branchStocks.map(s => [s.productId, s.quantity]))

      for (const productId of productIds) {
        const required = requiredByProduct[productId]
        const available = stockByProduct.get(productId) ?? 0

        if (available < required) {
          badRequest('Insufficient stock for one or more products')
        }
      }
    }

    const created = await tx.sale.create({
      data: {
        branchId: parsed.branchId,
        clientId: parsed.clientId ?? null,
        userId: parsed.userId ?? null,
        total: parsed.total,
        paymentMethod: parsed.paymentMethod,
        paymentMediumId: paymentMedium.id,
        items: {
          create: parsed.items.map(i => ({
            productId: i.productId || null,
            serviceId: i.serviceId || null,
            name: i.name,
            quantity: i.quantity,
            price: i.price
          }))
        }
      },
      include: { items: true }
    })

    await tx.cashMovement.create({
      data: {
        sessionId: openSession!.id,
        saleId: created.id,
        amount: parsed.total,
        type: 'DEPOSIT',
        paymentMethod: parsed.paymentMethod,
        paymentMediumId: paymentMedium.id,
        reason: 'SALE'
      }
    })

    if (productIds.length) {
      await tx.stockMovement.create({
        data: {
          branchId: parsed.branchId,
          type: 'OUT',
          reference: `SALE:${created.id}`,
          items: {
            create: productIds.map((productId) => ({
              productId,
              quantity: requiredByProduct[productId]
            }))
          }
        }
      })

      for (const productId of productIds) {
        await tx.branchStock.update({
          where: {
            branchId_productId: {
              branchId: parsed.branchId,
              productId
            }
          },
          data: {
            quantity: {
              decrement: requiredByProduct[productId]
            }
          }
        })
      }
    }

    return created
  })

  return sale
})
