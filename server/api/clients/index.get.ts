import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { getAllowedBranchIds } from '~/server/utils/branchAccess'

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])
  const allowedBranchIds = await getAllowedBranchIds(u)

  const clients = await prisma.client.findMany({
    where: allowedBranchIds
      ? {
          OR: [
            { appointments: { some: { branchId: { in: allowedBranchIds } } } },
            { sales: { some: { branchId: { in: allowedBranchIds } } } }
          ]
        }
      : undefined,
    include: {
      loyaltyLedger: { select: { points: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  const emails = clients.map(c => c.email).filter((v): v is string => !!v)
  const phones = clients.map(c => c.phone).filter((v): v is string => !!v)

  const users = await prisma.user.findMany({
    where: {
      role: 'CLIENT',
      OR: [
        ...(emails.length ? [{ email: { in: emails } }] : []),
        ...(phones.length ? [{ phone: { in: phones } }] : [])
      ]
    },
    select: { id: true, email: true, phone: true }
  })

  const userByEmail = new Set(users.map(u => u.email).filter((v): v is string => !!v))
  const userByPhone = new Set(users.map(u => u.phone).filter((v): v is string => !!v))

  return clients.map((client) => ({
    ...client,
    pointsBalance: client.loyaltyLedger.reduce((acc, row) => acc + row.points, 0),
    hasUser: (!!client.email && userByEmail.has(client.email)) || (!!client.phone && userByPhone.has(client.phone))
  }))
})
