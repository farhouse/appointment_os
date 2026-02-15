import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { z } from 'zod'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'

const schema = z.object({
  branchId: z.string().uuid(),
  name: z.string().min(1),
  active: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN'])

  const data = await readBodyValidated(event, schema)

  return prisma.cashBox.create({
    data: {
      branchId: data.branchId,
      name: data.name,
      active: data.active ?? true
    }
  })
})
