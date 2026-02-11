import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'

// MVP stub: accept a file reference or base64; real parsing TBD.
const schema = z.object({
  filename: z.string().optional(),
  contentBase64: z.string().optional(),
  mapping: z.record(z.string(), z.string()).optional()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  const parsed = await readBodyValidated(event, schema)

  return {
    ok: true,
    preview: [],
    warnings: ['Import Excel preview is a stub in MVP skeleton'],
    received: { filename: parsed.filename }
  }
})
