import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { z } from 'zod'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated, requireParam } from '~/server/utils/http'
import { notFound } from '~/server/utils/errors'

const schema = z.object({
  name: z.string().min(1).optional(),
  active: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN'])

  const id = requireParam(event, 'id')
  const data = await readBodyValidated(event, schema)

  try {
    return await prisma.cashBox.update({
      where: { id },
      data
    })
  } catch (e) {
    notFound('CashBox not found')
  }
})
