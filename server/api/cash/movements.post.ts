import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

const schema = z.object({
  sessionId: z.string().uuid(),
  amount: z.number().positive(),
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  reason: z.string().optional().nullable()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Error', data: parsed.error.issues })
  }

  return prisma.cashMovement.create({
    data: {
      sessionId: parsed.data.sessionId,
      amount: parsed.data.amount as any,
      type: parsed.data.type as any,
      reason: parsed.data.reason ?? null
    }
  })
})
