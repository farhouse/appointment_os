import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])
  const clients = await prisma.client.findMany()
  return clients
})
