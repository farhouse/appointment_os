import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'

const schema = z.object({
  token: z.string().optional(),
  commit: z.boolean().default(true)
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  await readBodyValidated(event, schema)

  return { ok: true, imported: { clients: 0, services: 0, products: 0, stock: 0 }, note: 'stub' }
})
