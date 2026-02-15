import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { branchUpdateSchema } from '~/server/utils/schemas'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated, requireParam } from '~/server/utils/http'
import { notFound } from '~/server/utils/errors'

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER'])
  const id = requireParam(event, 'id')
  const validation = await readBodyValidated(event, branchUpdateSchema)

  try {
    const branch = await prisma.branch.update({
      where: { id },
      data: validation
    })
    return branch
  } catch (e) {
    notFound('Branch not found')
  }
})
