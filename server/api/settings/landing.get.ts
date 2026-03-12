import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN'])

  const config = await prisma.landingConfig.findUnique({ where: { id: 'default' } })
  return {
    html: config?.html || ''
  }
})
