import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole, getAuthUser } from '~/server/utils/permissions'

const schema = z.object({
  branchId: z.string().uuid(),
  openingAmount: z.number().nonnegative()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])
  const u = getAuthUser(event)

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Error', data: parsed.error.issues })
  }

  const today = new Date()
  today.setHours(0,0,0,0)

  return prisma.cashSession.create({
    data: {
      branchId: parsed.data.branchId,
      openedBy: u.userId,
      openingBalance: parsed.data.openingAmount as any,
      date: today
    }
  })
})
