import { defineEventHandler } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'

const schema = z.object({
  sessionId: z.string().uuid(),
  amount: z.number().positive(),
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  reason: z.string().optional().nullable(),
  appointmentId: z.string().uuid().optional().nullable()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const parsed = await readBodyValidated(event, schema)

  return prisma.cashMovement.create({
    data: {
      sessionId: parsed.sessionId,
      amount: parsed.amount as any,
      type: parsed.type as any,
      reason: parsed.reason ?? null,
      appointmentId: parsed.appointmentId ?? null
    }
  })
})
