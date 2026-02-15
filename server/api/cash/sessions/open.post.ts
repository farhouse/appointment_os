import { defineEventHandler } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole, getAuthUser } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'

const schema = z.object({
  branchId: z.string().uuid(),
  cashBoxId: z.string().uuid(),
  openingAmount: z.number().nonnegative()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])
  const u = getAuthUser(event)

  const parsed = await readBodyValidated(event, schema)

  const today = new Date()
  today.setHours(0,0,0,0)

  return prisma.cashSession.create({
    data: {
      branchId: parsed.branchId,
      cashBoxId: parsed.cashBoxId,
      openedBy: u.userId,
      openingBalance: parsed.openingAmount as any,
      date: today
    }
  })
})
