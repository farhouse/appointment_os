import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])
  const employees = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      branches: {
        include: {
          branch: true
        }
      }
    }
  })
  return employees
})
