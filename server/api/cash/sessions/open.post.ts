import { defineEventHandler } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole, getAuthUser } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { badRequest } from '~/server/utils/errors'
import { resolvePaymentMedium } from '~/server/utils/paymentMethods'

const schema = z.object({
  branchId: z.string().uuid(),
  cashBoxId: z.string().uuid().optional().nullable(),
  openingAmount: z.number().nonnegative()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])
  const u = getAuthUser(event)

  const parsed = await readBodyValidated(event, schema)

  const today = new Date()
  today.setHours(0,0,0,0)

  const existingOpen = await prisma.cashSession.findFirst({
    where: {
      branchId: parsed.branchId,
      closingTime: null
    }
  })

  if (existingOpen) {
    badRequest('Branch already has an open session')
  }

  return prisma.$transaction(async (tx) => {
    const data: any = {
      branchId: parsed.branchId,
      openedBy: u.userId,
      openingBalance: parsed.openingAmount as any,
      date: today
    }
    if (parsed.cashBoxId) data.cashBoxId = parsed.cashBoxId

    const session = await tx.cashSession.create({ data })

    if (parsed.openingAmount > 0) {
      const cashMedium = await resolvePaymentMedium(tx, 'CASH')
      if (!cashMedium) {
        badRequest('Cash payment medium required')
      }

      await tx.cashMovement.create({
        data: {
          sessionId: session.id,
          amount: parsed.openingAmount,
          type: 'DEPOSIT',
          paymentMethod: 'CASH',
          paymentMediumId: cashMedium.id,
          reason: 'OPENING_CASH'
        }
      })
    }

    return session
  })
})
