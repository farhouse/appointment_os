import { defineEventHandler } from 'h3'
import { requireRole } from '~/server/utils/permissions'
import { z } from 'zod'
import { readBodyValidated } from '~/server/utils/http'

const schema = z.object({
  channel: z.enum(['EMAIL', 'WHATSAPP']).default('EMAIL'),
  to: z.string().min(1),
  message: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN'])

  const parsed = await readBodyValidated(event, schema)

  // MVP stub (no provider wired yet)
  return { ok: true, queued: false, note: 'notification providers not wired in MVP skeleton', ...parsed }
})
