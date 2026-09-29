import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { badRequest, notFound } from '~/server/utils/errors'
import { resolveClientProfile } from '~/server/utils/clientProfile'

const schema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1)
})

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['CLIENT'])
  const payload = await readBodyValidated(event, schema)

  const client = await resolveClientProfile(u)

  const product = await prisma.product.findUnique({ where: { id: payload.productId } }) as any
  if (!product) notFound('Product not found')
  if (product.pointsCost <= 0) badRequest('Product not redeemable')

  const totalCost = Number(product.pointsCost) * payload.quantity

  const totals = await prisma.loyaltyLedger.aggregate({
    where: { clientId: client.id },
    _sum: { points: true }
  })
  const balance = totals._sum.points ?? 0
  if (balance < totalCost) badRequest('Insufficient points')

  const reason = `REDEEM: ${product.name} x${payload.quantity}`

  const result = await prisma.$transaction(async (tx) => {
    await (tx as any).redemption.create({
      data: {
        clientId: client.id,
        productId: product.id,
        quantity: payload.quantity,
        pointsCost: totalCost
      }
    })

    await tx.loyaltyLedger.create({
      data: {
        clientId: client.id,
        points: -totalCost,
        reason
      }
    })

    const updated = await tx.loyaltyLedger.aggregate({
      where: { clientId: client.id },
      _sum: { points: true }
    })

    return updated._sum.points ?? 0
  })

  return { balance: result }
})
