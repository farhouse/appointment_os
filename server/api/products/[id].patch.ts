import { defineEventHandler, createError } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { requireParam } from '~/server/utils/http'

const schema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.number().nonnegative().optional(),
  cost: z.number().nonnegative().optional().nullable()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  const id = requireParam(event, 'id')

  const parsed = await readBodyValidated(event, schema)
  return prisma.product.update({ where: { id }, data: parsed as any })
})
