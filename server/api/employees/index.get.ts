import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])
  const employees = await prisma.user.findMany({
    where: {
      role: {
        in: ['OWNER', 'ADMIN', 'MANAGER', 'BARBER']
      }
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
