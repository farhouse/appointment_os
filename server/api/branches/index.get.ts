import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN'])
  const branches = await prisma.branch.findMany({ orderBy: { name: 'asc' } })
  return branches
})
