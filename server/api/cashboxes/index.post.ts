import { defineEventHandler } from 'h3'
import { createError } from 'h3'
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

  try {
    return await prisma.cashBox.create({
      data: {
        branchId: data.branchId,
        name: data.name,
        active: data.active ?? true
      }
    })
  } catch (e: any) {
    // Unique constraint on (branchId, name)
    if (e?.code === 'P2002') {
      throw createError({ statusCode: 400, statusMessage: 'Ya existe una caja con ese nombre en esta sucursal.' })
    }
    throw e
  }
})
