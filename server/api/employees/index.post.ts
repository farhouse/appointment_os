import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { employeeSchema } from '~/server/utils/schemas'
import bcrypt from 'bcrypt'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { badRequest, conflict, forbidden } from '~/server/utils/errors'
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

  const { email, password, branchIds, ...rest } = await readBodyValidated(event, employeeSchema)

  assertCanAssignRole(u.role as keyof typeof assignableRolesByActor, (rest as any).role)
  for (const branchId of branchIds || []) {
    await requireBranchAccess(u, branchId)
  }

  if (!password) {
    badRequest('Password required for new employee')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        ...rest,
        branches: {
          create: branchIds?.map(id => ({ branchId: id }))
        }
      }
    })
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (e: any) {
    if (e.code === 'P2002') {
      conflict('Email already exists')
    }
    throw e
  }
})
