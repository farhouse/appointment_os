import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { paymentMethodOrder } from '~/server/utils/paymentMethods'

const methodSchema = z.enum(paymentMethodOrder)
const schema = z.object({
  method: methodSchema,
  active: z.boolean()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN'])

  const parsed = await readBodyValidated(event, schema)

  await prisma.paymentMethodConfig.upsert({
    where: { method: parsed.method },
    create: { method: parsed.method, active: parsed.active },
    update: { active: parsed.active }
  })

  return { ok: true }
})
