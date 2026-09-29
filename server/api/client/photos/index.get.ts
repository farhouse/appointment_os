import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { resolveClientProfile } from '~/server/utils/clientProfile'

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['CLIENT'])
  const client = await resolveClientProfile(u)

  return prisma.clientPhoto.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: 'desc' }
  })
})
