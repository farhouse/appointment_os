import { defineEventHandler } from 'h3'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireRole, getAuthUser } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { requireParam } from '~/server/utils/http'
import { badRequest } from '~/server/utils/errors'
import { requireBranchAccess } from '~/server/utils/branchAccess'

const schema = z.object({
  countedCash: z.number().nonnegative(),
  countedCard: z.number().nonnegative().optional(),
  countedTransfer: z.number().nonnegative().optional(),
  countedOther: z.number().nonnegative().optional(),
  notes: z.string().optional().nullable()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])
  const u = getAuthUser(event)

  const id = requireParam(event, 'id')

  const parsed = await readBodyValidated(event, schema)

  const session = await prisma.cashSession.findUnique({
    where: { id },
    select: { branchId: true, closingTime: true }
  })
  if (!session || session.closingTime) badRequest('Open cash session required')
  await requireBranchAccess(u, session.branchId)

  return prisma.cashSession.update({
    where: { id },
    data: {
      closingTime: new Date(),
      closedBy: u.userId,
      closingBalance: parsed.countedCash as any,
      ...(parsed.countedCash != null ? { closingCash: parsed.countedCash as any } : {}),
      ...(parsed.countedCard != null ? { closingCard: parsed.countedCard as any } : {}),
      ...(parsed.countedTransfer != null ? { closingTransfer: parsed.countedTransfer as any } : {}),
      ...(parsed.countedOther != null ? { closingOther: parsed.countedOther as any } : {})
    } as any
  })
})
