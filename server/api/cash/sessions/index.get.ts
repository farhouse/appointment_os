import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const query = getQuery(event)
  const branchId = query.branchId as string | undefined
  const cashBoxId = query.cashBoxId as string | undefined

  const sessions = await prisma.cashSession.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      ...(cashBoxId ? { cashBoxId } : {})
    },
    include: { movements: true, cashBox: true },
    orderBy: { date: 'desc' }
  })

  const openedByIds = Array.from(new Set(sessions.map(session => session.openedBy).filter(Boolean)))
  if (!openedByIds.length) return sessions

  const users = await prisma.user.findMany({
    where: { id: { in: openedByIds } },
    select: { id: true, name: true }
  })

  const userMap = new Map(users.map(user => [user.id, user.name]))

  return sessions.map(session => ({
    ...session,
    openedByName: userMap.get(session.openedBy) ?? null
  }))
})
