import type { PrismaClient } from '@prisma/client'

export const paymentMethodOrder = ['CASH', 'CARD', 'TRANSFER', 'OTHER'] as const
export type PaymentMethodCode = (typeof paymentMethodOrder)[number]

const defaultLabels: Record<PaymentMethodCode, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  OTHER: 'Otro'
}

export async function ensurePaymentMethodConfigs(prisma: PrismaClient) {
  for (const method of paymentMethodOrder) {
    const systemRow = await prisma.paymentMethodConfig.findFirst({
      where: { method, isSystem: true }
    })

    if (!systemRow) {
      await prisma.paymentMethodConfig.create({
        data: {
          method,
          name: defaultLabels[method],
          active: true,
          isSystem: true
        }
      })
    }
  }
}

export async function isPaymentMethodEnabled(prisma: PrismaClient, method: PaymentMethodCode) {
  const count = await prisma.paymentMethodConfig.count({
    where: { method, active: true }
  })
  return count > 0
}

export async function resolvePaymentMedium(
  prisma: PrismaClient,
  method: PaymentMethodCode,
  paymentMediumId?: string
) {
  if (paymentMediumId) {
    const selected = await prisma.paymentMethodConfig.findUnique({ where: { id: paymentMediumId } })
    if (!selected || !selected.active || selected.method !== method) {
      return null
    }
    return selected
  }

  return prisma.paymentMethodConfig.findFirst({
    where: { method, active: true },
    orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }]
  })
}
