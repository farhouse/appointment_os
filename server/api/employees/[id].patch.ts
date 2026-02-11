import { defineEventHandler, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { employeeSchema } from '~/server/utils/schemas'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { requireParam } from '~/server/utils/http'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  const id = requireParam(event, 'id')

  const parsed = await readBodyValidated(event, employeeSchema.partial())

  // NOTE: password updates should be via separate endpoint.
  const { branchIds, password, ...data } = parsed as any

  const user = await prisma.user.update({ where: { id }, data })

  if (branchIds) {
    await prisma.userBranch.deleteMany({ where: { userId: id } })
    await prisma.userBranch.createMany({ data: branchIds.map((branchId: string) => ({ userId: id, branchId })) })
  }

  return user
})
