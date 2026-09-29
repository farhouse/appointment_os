import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { employeeSchema } from '~/server/utils/schemas'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { requireParam } from '~/server/utils/http'
import { forbidden, notFound } from '~/server/utils/errors'
import { requireBranchAccess } from '~/server/utils/branchAccess'

const assignableRolesByActor = {
  OWNER: new Set(['OWNER', 'ADMIN', 'MANAGER', 'BARBER']),
  ADMIN: new Set(['MANAGER', 'BARBER']),
  MANAGER: new Set(['BARBER'])
} as const

function assertCanAssignRole(actorRole: keyof typeof assignableRolesByActor, targetRole: string) {
  if (!assignableRolesByActor[actorRole]?.has(targetRole as never)) {
    forbidden('Cannot assign requested role')
  }
}

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const id = requireParam(event, 'id')

  const parsed = await readBodyValidated(event, employeeSchema.partial())

  if ((parsed as any).role) {
    const existing = await prisma.user.findUnique({ where: { id }, select: { role: true } })
    if (!existing) {
      notFound('Employee not found')
    }
    if (existing.role !== (parsed as any).role) {
      assertCanAssignRole(u.role as keyof typeof assignableRolesByActor, (parsed as any).role)
    }
  }

  // NOTE: password updates should be via separate endpoint.
  const { branchIds, password, ...data } = parsed as any
  for (const branchId of branchIds || []) {
    await requireBranchAccess(u, branchId)
  }

  const user = await prisma.user.update({ where: { id }, data })

  if (branchIds) {
    await prisma.userBranch.deleteMany({ where: { userId: id } })
    await prisma.userBranch.createMany({ data: branchIds.map((branchId: string) => ({ userId: id, branchId })) })
  }

  return user
})
