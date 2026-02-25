import { defineEventHandler } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated, requireParam } from '~/server/utils/http'

const schema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.number().positive().optional(),
  duration: z.number().int().positive().optional(),
  pointsReward: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN'])

  const id = requireParam(event, 'id')
  const data = await readBodyValidated(event, schema)

  return prisma.service.update({ where: { id }, data: data as any })
})
