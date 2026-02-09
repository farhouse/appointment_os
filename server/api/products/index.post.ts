import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

const schema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.number().nonnegative(),
  cost: z.number().nonnegative().optional().nullable()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Error', data: parsed.error.issues })
  }

  return prisma.product.create({ data: parsed.data as any })
})
