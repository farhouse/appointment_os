import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { ensurePaymentMethodConfigs, paymentMethodOrder } from '~/server/utils/paymentMethods'

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const client = prisma as typeof prisma

  await ensurePaymentMethodConfigs(client)
  const methods = await client.paymentMethodConfig.findMany({
    orderBy: { method: 'asc' }
  })
  const map = new Map<(typeof paymentMethodOrder)[number], (typeof methods)[number]>()
  for (const method of methods) {
    map.set(method.method, method)
  }
  const ordered = paymentMethodOrder
    .map((method) => {
      const entry = map.get(method)
      if (!entry) return null
      return { method: entry.method, active: entry.active }
    })
    .filter((method): method is { method: (typeof paymentMethodOrder)[number]; active: boolean } => method !== null)

  return { methods: ordered }
})
