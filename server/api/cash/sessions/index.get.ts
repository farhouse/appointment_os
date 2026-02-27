import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { forbidden } from '~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const authUser = requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const query = getQuery(event)
  const branchId = query.branchId as string | undefined
  const cashBoxId = query.cashBoxId as string | undefined
  const status = query.status as string | undefined
  const from = query.from as string | undefined
  const to = query.to as string | undefined
  const includeTotals = query.includeTotals === 'true'
  const includeBranch = query.includeBranch === 'true'

  if (authUser.role === 'MANAGER' && !branchId) {
    forbidden('Forbidden')
  }

  if (authUser.role === 'MANAGER' && includeBranch) {
    forbidden('Forbidden')
  }

  const dateFilter: { gte?: Date; lte?: Date } = {}
  if (typeof from === 'string' && from) {
    const d = new Date(`${from}T00:00:00.000Z`)
    if (!Number.isNaN(d.getTime())) dateFilter.gte = d
  }
  if (typeof to === 'string' && to) {
    const d = new Date(`${to}T23:59:59.999Z`)
    if (!Number.isNaN(d.getTime())) dateFilter.lte = d
  }

  const sessions = await prisma.cashSession.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      ...(cashBoxId ? { cashBoxId } : {}),
      ...(status === 'OPEN' ? { closingTime: null } : {}),
      ...(status === 'CLOSED' ? { closingTime: { not: null } } : {}),
      ...(dateFilter.gte || dateFilter.lte ? { date: dateFilter } : {})
    },
    include: {
      movements: includeTotals
        ? { orderBy: { createdAt: 'desc' } }
        : { take: 10, orderBy: { createdAt: 'desc' } },
      cashBox: true,
      ...(includeBranch ? { branch: { select: { id: true, name: true } } } : {})
    },
    orderBy: { date: 'desc' }
  })

  const openedByIds = Array.from(new Set(sessions.map(session => session.openedBy).filter(Boolean)))
  if (!openedByIds.length) return sessions

  const users = await prisma.user.findMany({
    where: { id: { in: openedByIds } },
    select: { id: true, name: true }
  })

  const userMap = new Map(users.map(user => [user.id, user.name]))

  return sessions.map(session => {
    const movements = session.movements || []
    const openingBalance = Number(session.openingBalance)
    const hasOpeningMovement = movements.some(movement => movement.reason === 'OPENING_CASH')
    const openingContribution = !hasOpeningMovement && Number.isFinite(openingBalance) ? openingBalance : 0

    const totalsByMethod = movements.reduce((acc, movement) => {
      const method = (movement as any).paymentMethod || 'CASH'
      const signed = movement.type === 'WITHDRAWAL' ? -Number(movement.amount) : Number(movement.amount)
      acc[method] = (acc[method] || 0) + signed
      return acc
    }, { CASH: openingContribution } as Record<string, number>)

    const lastMovement = movements.reduce((latest: any, current: any) => {
      if (!latest) return current
      return new Date(current.createdAt).getTime() > new Date(latest.createdAt).getTime() ? current : latest
    }, null as any)

    return {
      ...session,
      openedByName: userMap.get(session.openedBy) ?? null,
      totalsByMethod,
      totalAmount: movements.reduce((acc, movement) => {
        const signed = movement.type === 'WITHDRAWAL' ? -Number(movement.amount) : Number(movement.amount)
        return acc + signed
      }, openingContribution),
      lastMovement
    }
  })
})
