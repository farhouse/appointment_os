import type { PrismaClient } from '@prisma/client'

export const paymentMethodOrder = ['CASH', 'CARD', 'TRANSFER', 'OTHER'] as const
export type PaymentMethodCode = (typeof paymentMethodOrder)[number]

export async function ensurePaymentMethodConfigs(prisma: PrismaClient) {
  await prisma.$transaction(
    paymentMethodOrder.map(method => (
      prisma.paymentMethodConfig.upsert({
        where: { method },
        create: { method, active: true },
        update: {}
      })
    ))
  )
}

export async function ensurePaymentMethodConfig(prisma: PrismaClient, method: PaymentMethodCode) {
  return prisma.paymentMethodConfig.upsert({
    where: { method },
    create: { method, active: true },
    update: {}
  })
}
