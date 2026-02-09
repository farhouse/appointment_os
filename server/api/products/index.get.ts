import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])
  return prisma.product.findMany({ orderBy: { name: 'asc' } })
})
