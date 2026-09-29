import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { requireQueryString } from '~/server/utils/http'
import { requireBranchAccess } from '~/server/utils/branchAccess'

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const branchId = requireQueryString(event, 'branchId')
  const productId = requireQueryString(event, 'productId')
  await requireBranchAccess(u, branchId)

  return prisma.branchStock.delete({
    where: { branchId_productId: { branchId, productId } }
  })
})
