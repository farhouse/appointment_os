import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { requireQueryString } from '~/server/utils/http'

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const q = getQuery(event)
  const branchId = requireQueryString(event, 'branchId')
  const includeMovements = q.includeMovements === 'true'
  const cashBoxId = typeof q.cashBoxId === 'string' ? q.cashBoxId : undefined

  const session = await prisma.cashSession.findFirst({
    where: {
      branchId,
      closingTime: null,
      ...(cashBoxId
        ? {
            OR: [{ cashBoxId }, { cashBoxId: null }]
          }
        : {})
    },
    include: {
      cashBox: true,
      movements: includeMovements
        ? { orderBy: { createdAt: 'desc' } }
        : { take: 10, orderBy: { createdAt: 'desc' } }
    }
  })

  if (!session) return null

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

  const totalAmount = movements.reduce((acc, movement) => {
    const signed = movement.type === 'WITHDRAWAL' ? -Number(movement.amount) : Number(movement.amount)
    return acc + signed
  }, openingContribution)

  const lastMovement = movements.reduce((latest: any, current: any) => {
    if (!latest) return current
    return new Date(current.createdAt).getTime() > new Date(latest.createdAt).getTime() ? current : latest
  }, null as any)

  return {
    ...session,
    totalsByMethod,
    totalAmount,
    lastMovement
  }
})
