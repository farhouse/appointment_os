import { defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { getAllowedBranchIds } from '~/server/utils/branchAccess'

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])
  const id = getRouterParam(event, 'id')
  const allowedBranchIds = await getAllowedBranchIds(u)

  const appointments = await prisma.appointment.findMany({
    where: {
      clientId: id,
      ...(allowedBranchIds ? { branchId: { in: allowedBranchIds } } : {})
    },
    include: {
        services: {
            include: {
                service: true
            }
        },
        professional: {
            select: { name: true }
        }
    },
    orderBy: { startTime: 'desc' }
  })

  return appointments
})
