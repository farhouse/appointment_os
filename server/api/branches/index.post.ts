import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { branchSchema } from '~/server/utils/schemas'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])
  const data = await readBodyValidated(event, branchSchema)

  const branch = await prisma.branch.create({
    data
  })

  return branch
})
