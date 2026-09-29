import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN'])

  const templates = await prisma.notificationTemplate.findMany({
    orderBy: { name: 'asc' }
  })

  return { templates }
})
