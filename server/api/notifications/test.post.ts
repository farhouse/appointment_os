import { defineEventHandler, readBody, createError } from 'h3'
import { requireRole } from '~/server/utils/permissions'
import { z } from 'zod'

const schema = z.object({
  channel: z.enum(['EMAIL', 'WHATSAPP']).default('EMAIL'),
  to: z.string().min(1),
  message: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN'])

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Error', data: parsed.error.issues })
  }

  // MVP stub (no provider wired yet)
  return { ok: true, queued: false, note: 'notification providers not wired in MVP skeleton', ...parsed.data }
})
