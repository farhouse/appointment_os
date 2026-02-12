import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { requireParam } from '~/server/utils/http'
import { badRequest } from '~/server/utils/errors'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])
  const id = requireParam(event, 'id')

  try {
    const branch = await prisma.branch.delete({
      where: { id },
    })
    return branch
  } catch (e) {
    badRequest('Cannot delete branch with existing records')
  }
})
