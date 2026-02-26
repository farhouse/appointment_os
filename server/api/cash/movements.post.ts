import { defineEventHandler } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { badRequest } from '~/server/utils/errors'

const schema = z.object({
  sessionId: z.string().uuid(),
  amount: z.number().positive(),
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'OTHER']),
  reason: z.string().optional().nullable(),
  appointmentId: z.string().uuid().optional().nullable()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const parsed = await readBodyValidated(event, schema)

  const session = await prisma.cashSession.findUnique({
    where: { id: parsed.sessionId }
  })

  if (!session || session.closingTime) {
    badRequest('Open cash session required')
  }

  return prisma.cashMovement.create({
    data: {
      sessionId: parsed.sessionId,
      amount: parsed.amount as any,
      type: parsed.type as any,
      paymentMethod: parsed.paymentMethod as any,
      reason: parsed.reason ?? null,
      appointmentId: parsed.appointmentId ?? null
    } as any
  })
})
