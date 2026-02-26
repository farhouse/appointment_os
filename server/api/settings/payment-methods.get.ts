import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

const defaults = ['CASH', 'CARD', 'TRANSFER', 'OTHER']

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const client = prisma as any
  if (!client.paymentMethodConfig) {
    return {
      methods: defaults.map(method => ({ method, active: true }))
    }
  }

  const methods = await client.paymentMethodConfig.findMany({
    orderBy: { method: 'asc' }
  })

  if (!methods.length) {
    return {
      methods: defaults.map(method => ({ method, active: true }))
    }
  }

  const map = new Map(methods.map((m: any) => [m.method, m as { active?: boolean }]))
  return {
    methods: defaults.map(method => {
      const entry = map.get(method) as { active?: boolean } | undefined
      return {
        method,
        active: entry?.active ?? true
      }
    })
  }
})
