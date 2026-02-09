import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { employeeSchema } from '~/server/utils/schemas'
import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])

  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })

  const body = await readBody(event)
  const parsed = employeeSchema.partial().safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Error', data: parsed.error.issues })
  }

  // NOTE: password updates should be via separate endpoint.
  const { branchIds, password, ...data } = parsed.data as any

  const user = await prisma.user.update({ where: { id }, data })

  if (branchIds) {
    await prisma.userBranch.deleteMany({ where: { userId: id } })
    await prisma.userBranch.createMany({ data: branchIds.map((branchId: string) => ({ userId: id, branchId })) })
  }

  return user
})
