import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { requireRole } from '~/server/utils/permissions'

// Placeholder: commission model not yet defined in Prisma schema.
const schema = z.object({ commissionPct: z.number().min(0).max(100) })

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Error', data: parsed.error.issues })
  }

  return { ok: true, note: 'commission not implemented in schema yet', employeeId: id, ...parsed.data }
})
