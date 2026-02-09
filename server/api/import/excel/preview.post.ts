import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { requireRole } from '~/server/utils/permissions'

// MVP stub: accept a file reference or base64; real parsing TBD.
const schema = z.object({
  filename: z.string().optional(),
  contentBase64: z.string().optional(),
  mapping: z.record(z.string()).optional()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Error', data: parsed.error.issues })
  }

  return {
    ok: true,
    preview: [],
    warnings: ['Import Excel preview is a stub in MVP skeleton'],
    received: { filename: parsed.data.filename }
  }
})
