import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { requireRole } from '~/server/utils/permissions'

const schema = z.object({
  token: z.string().optional(),
  commit: z.boolean().default(true)
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Error', data: parsed.error.issues })
  }

  return { ok: true, imported: { clients: 0, services: 0, products: 0, stock: 0 }, note: 'stub' }
})
