import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole, getAuthUser } from '~/server/utils/permissions'

const schema = z.object({
  countedCash: z.number().nonnegative(),
  notes: z.string().optional().nullable()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])
  const u = getAuthUser(event)

  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Error', data: parsed.error.issues })
  }

  return prisma.cashSession.update({
    where: { id },
    data: {
      closingTime: new Date(),
      closedBy: u.userId,
      closingBalance: parsed.data.countedCash as any
    }
  })
})
