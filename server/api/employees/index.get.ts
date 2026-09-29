import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { getAllowedBranchIds } from '~/server/utils/branchAccess'

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])
  const allowedBranchIds = await getAllowedBranchIds(u)
  const employees = await prisma.user.findMany({
    where: {
      role: {
        in: ['OWNER', 'ADMIN', 'MANAGER', 'BARBER']
      },
      ...(allowedBranchIds ? { branches: { some: { branchId: { in: allowedBranchIds } } } } : {})
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      commissionRate: true,
      createdAt: true,
      updatedAt: true,
      branches: {
        include: {
          branch: true
        }
      }
    }
  })
  return employees
})
