import { defineEventHandler, createError } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole, getAuthUser } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { requireParam } from '~/server/utils/http'

const schema = z.object({
  countedCash: z.number().nonnegative(),
  notes: z.string().optional().nullable()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])
  const u = getAuthUser(event)

  const id = requireParam(event, 'id')

  const parsed = await readBodyValidated(event, schema)

  return prisma.cashSession.update({
    where: { id },
    data: {
      closingTime: new Date(),
      closedBy: u.userId,
      closingBalance: parsed.countedCash as any
    }
  })
})
