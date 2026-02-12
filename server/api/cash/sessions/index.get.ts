import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { requireQueryString } from '~/server/utils/http'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  const branchId = requireQueryString(event, 'branchId')

  return prisma.cashSession.findMany({
    where: { branchId },
    include: { movements: true },
    orderBy: { date: 'desc' }
  })
})
