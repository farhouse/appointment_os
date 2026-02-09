import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

// MVP: store notification templates/settings in NotificationTemplate rows or later a Settings table.
export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN'])

  const templates = await prisma.notificationTemplate.findMany({
    orderBy: { name: 'asc' }
  })

  return { templates }
})
