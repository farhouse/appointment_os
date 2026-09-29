import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { requireParam } from '~/server/utils/http'
import { forbidden, notFound } from '~/server/utils/errors'
import { requireBranchAccess } from '~/server/utils/branchAccess'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['OWNER', 'ADMIN', 'MANAGER', 'BARBER'])
  const id = requireParam(event, 'id')

  const block = await prisma.timeBlock.findUnique({ where: { id } })
  if (!block) notFound('Time block not found')
  await requireBranchAccess(user, block.branchId)

  // Authorization
  if (user.role === 'BARBER') {
    if (block.professionalId !== user.userId) {
      forbidden('Forbidden')
    }
  }

  await prisma.timeBlock.delete({ where: { id } })

  return { success: true }
})
