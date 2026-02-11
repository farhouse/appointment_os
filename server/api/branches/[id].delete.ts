import { defineEventHandler, createError, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])
  const id = getRouterParam(event, 'id')

  try {
    const branch = await prisma.branch.delete({
      where: { id },
    })
    return branch
  } catch (e) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot delete branch with existing records',
    })
  }
})
