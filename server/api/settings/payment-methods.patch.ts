import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { ensurePaymentMethodConfigs, paymentMethodOrder } from '~/server/utils/paymentMethods'
import { badRequest } from '~/server/utils/errors'

const schema = z.object({
  id: z.string().uuid().optional(),
  method: z.enum(paymentMethodOrder).optional(),
  active: z.boolean().optional(),
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(200).nullable().optional()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN'])

  const parsed = await readBodyValidated(event, schema)
  await ensurePaymentMethodConfigs(prisma)

  if (parsed.id) {
    const existing = await prisma.paymentMethodConfig.findUnique({ where: { id: parsed.id } })
    if (!existing) badRequest('Payment medium not found')

    const updated = await prisma.paymentMethodConfig.update({
      where: { id: parsed.id },
      data: {
        ...(typeof parsed.active === 'boolean' ? { active: parsed.active } : {}),
        ...(typeof parsed.name === 'string' ? { name: parsed.name } : {}),
        ...(parsed.description !== undefined ? { description: parsed.description } : {})
      }
    })

    return { ok: true, item: updated }
  }

  // Backward compatible toggle by base method
  if (!parsed.method || typeof parsed.active !== 'boolean') {
    badRequest('id or (method + active) required')
  }

  await prisma.paymentMethodConfig.updateMany({
    where: { method: parsed.method, isSystem: true },
    data: { active: parsed.active }
  })

  return { ok: true }
})
