import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { requireParam } from '~/server/utils/http'
import { notFound } from '~/server/utils/errors'

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN'])

  const id = requireParam(event, 'id')

  try {
    return await prisma.product.delete({ where: { id } })
  } catch (e) {
    notFound('Product not found')
  }
})
