import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { paymentMethodOrder } from '~/server/utils/paymentMethods'

const schema = z.object({
  method: z.enum(paymentMethodOrder),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(200).optional().nullable(),
  active: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN'])

  const parsed = await readBodyValidated(event, schema)

  const created = await prisma.paymentMethodConfig.create({
    data: {
      method: parsed.method,
      name: parsed.name,
      description: parsed.description ?? null,
      active: parsed.active ?? true,
      isSystem: false
    }
  })

  return { ok: true, item: created }
})
