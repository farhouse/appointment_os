import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { ensurePaymentMethodConfigs, paymentMethodOrder } from '~/server/utils/paymentMethods'

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  await ensurePaymentMethodConfigs(prisma)

  const media = await prisma.paymentMethodConfig.findMany({
    orderBy: [{ method: 'asc' }, { isSystem: 'desc' }, { createdAt: 'asc' }]
  })

  const methods = paymentMethodOrder.map((method) => ({
    method,
    active: media.some((m) => m.method === method && m.active)
  }))

  return { methods, media }
})
