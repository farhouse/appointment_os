import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { z } from 'zod'

const schema = z.object({
  method: z.enum(['CASH', 'CARD', 'TRANSFER', 'OTHER']),
  active: z.boolean()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN'])

  const client = prisma as any
  if (!client.paymentMethodConfig) {
    return { ok: true }
  }

  const parsed = await readBodyValidated(event, schema)

  await client.paymentMethodConfig.upsert({
    where: { method: parsed.method },
    create: { method: parsed.method, active: parsed.active },
    update: { active: parsed.active }
  })

  return { ok: true }
})
