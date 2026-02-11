import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { z } from 'zod'
import { readBodyValidated } from '~/server/utils/http'

const patchSchema = z.object({
  templates: z.array(z.object({
    name: z.string().min(1),
    subject: z.string().optional().nullable(),
    body: z.string().min(1),
    type: z.string().min(1)
  })).optional()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN'])

  const parsed = await readBodyValidated(event, patchSchema)
  const templates = parsed.templates || []
  const upserted = []
  for (const t of templates) {
    const row = await prisma.notificationTemplate.upsert({
      where: { name: t.name },
      create: { name: t.name, subject: t.subject ?? null, body: t.body, type: t.type },
      update: { subject: t.subject ?? null, body: t.body, type: t.type }
    })
    upserted.push(row)
  }

  return { ok: true, upserted }
})
