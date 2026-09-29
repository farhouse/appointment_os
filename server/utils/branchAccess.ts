import type { AuthUser } from '~/server/utils/auth'
import prisma from '~/server/utils/prisma'
import { forbidden } from '~/server/utils/errors'

export async function getAllowedBranchIds(u: AuthUser): Promise<string[] | null> {
  if (u.role === 'OWNER' || u.role === 'ADMIN') return null
  if (u.role !== 'MANAGER' && u.role !== 'BARBER') return []

  const rows = await prisma.userBranch.findMany({
    where: { userId: u.userId },
    select: { branchId: true }
  })

  return rows.map(row => row.branchId)
}

export async function requireBranchAccess(u: AuthUser, branchId: string) {
  const allowed = await getAllowedBranchIds(u)
  if (allowed && !allowed.includes(branchId)) forbidden('Forbidden')
}

export async function requireClientAccess(u: AuthUser, clientId: string) {
  const allowed = await getAllowedBranchIds(u)
  if (!allowed) return
  if (!allowed.length) forbidden('Forbidden')

  const [appointment, sale] = await Promise.all([
    prisma.appointment.findFirst({
      where: { clientId, branchId: { in: allowed } },
      select: { id: true }
    }),
    prisma.sale.findFirst({
      where: { clientId, branchId: { in: allowed } },
      select: { id: true }
    })
  ])

  if (!appointment && !sale) forbidden('Forbidden')
}
