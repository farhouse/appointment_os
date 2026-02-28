import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'

const TEMPLATE_NAME = 'whatsapp_appointment_message'

const schema = z.object({
  template: z.string().trim().min(10).max(500)
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN'])

  const parsed = await readBodyValidated(event, schema)

  const saved = await prisma.notificationTemplate.upsert({
    where: { name: TEMPLATE_NAME },
    update: {
      body: parsed.template,
      type: 'WHATSAPP',
      subject: null
    },
    create: {
      name: TEMPLATE_NAME,
      body: parsed.template,
      type: 'WHATSAPP',
      subject: null
    },
    select: { body: true, updatedAt: true }
  })

  return { ok: true, template: saved.body, updatedAt: saved.updatedAt }
})
