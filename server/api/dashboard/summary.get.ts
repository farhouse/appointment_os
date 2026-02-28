import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/permissions'
import { badRequest, forbidden } from '~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const u = getAuthUser(event)
  if (u.role !== 'OWNER' && u.role !== 'ADMIN' && u.role !== 'MANAGER') {
    forbidden('Forbidden')
  }

  const query = getQuery(event)
  const branchId = typeof query.branchId === 'string' ? query.branchId : ''

  if (u.role === 'MANAGER' && !branchId) {
    forbidden('Forbidden')
  }

  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(startOfDay)
  endOfDay.setHours(23, 59, 59, 999)

  const branchFilter = branchId ? { branchId } : {}

  const totalBranchesPromise = u.role === 'MANAGER'
    ? prisma.userBranch.count({ where: { userId: u.userId } })
    : prisma.branch.count()

  const [appointmentsToday, paidAppointmentsToday, openCashSessions, clientsServedTodayRaw, totalBranches] = await prisma.$transaction([
    prisma.appointment.count({
      where: {
        ...branchFilter,
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'FINISHED', 'PAID'] }
      }
    }),
    prisma.appointment.aggregate({
      where: {
        ...branchFilter,
        paidAt: { gte: startOfDay, lte: endOfDay },
        status: 'PAID'
      },
      _sum: { paidAmount: true }
    }),
    prisma.cashSession.count({
      where: {
        ...branchFilter,
        closingTime: null
      }
    }),
    prisma.appointment.findMany({
      where: {
        ...branchFilter,
        paidAt: { gte: startOfDay, lte: endOfDay },
        status: 'PAID'
      },
      select: { clientId: true }
    }),
    totalBranchesPromise
  ])

  const clientsServedToday = new Set(
    clientsServedTodayRaw
      .map(item => item.clientId)
      .filter((id): id is string => Boolean(id))
  ).size

  const revenueToday = paidAppointmentsToday._sum.paidAmount ? Number(paidAppointmentsToday._sum.paidAmount) : 0
  if (Number.isNaN(revenueToday)) {
    badRequest('Invalid revenue')
  }

  return {
    appointmentsToday,
    revenueToday,
    openCashSessions,
    clientsServedToday,
    totalBranches
  }
})
