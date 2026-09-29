import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { requireParam } from '~/server/utils/http'
import { notFound } from '~/server/utils/errors'
import { requireClientAccess } from '~/server/utils/branchAccess'

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const id = requireParam(event, 'id')
  await requireClientAccess(u, id)

  try {
    return await prisma.client.delete({ where: { id } })
  } catch {
    notFound('Client not found')
  }
})
