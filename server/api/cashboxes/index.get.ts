import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const authUser = requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const q = getQuery(event)
  const branchId = typeof q.branchId === 'string' && q.branchId.length ? q.branchId : null
  const activeOnly = q.activeOnly === 'true' || q.activeOnly === '1'

  const cashBoxes = await prisma.cashBox.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      ...(authUser.role === 'MANAGER' || activeOnly ? { active: true } : {})
    },
    orderBy: [{ branchId: 'asc' }, { name: 'asc' }],
    include: {
      branch: { select: { id: true, name: true } }
    }
  })

  return cashBoxes
})
