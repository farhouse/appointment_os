import { z } from 'zod'
import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { badRequest, forbidden } from '~/server/utils/errors'
import { requireBranchAccess } from '~/server/utils/branchAccess'

const createSchema = z.object({
  branchId: z.string().uuid(),
  professionalId: z.string().uuid().optional().nullable(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  allDay: z.boolean().optional(),
  reason: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['OWNER', 'ADMIN', 'MANAGER', 'BARBER'])
  const { branchId, professionalId, startTime, endTime, allDay, reason } = await readBodyValidated(event, createSchema)
  await requireBranchAccess(user, branchId)

  const start = new Date(startTime)
  const end = new Date(endTime)
  if (end <= start) badRequest('endTime must be after startTime')

  // Authorization Check
  if (user.role === 'BARBER') {
    if (professionalId && professionalId !== user.userId) {
      forbidden('Can only block own time')
    }
    if (!professionalId) {
      forbidden('Cannot create branch-wide blocks')
    }
  }

  if (professionalId) {
    const assignment = await prisma.userBranch.findUnique({
      where: { userId_branchId: { userId: professionalId, branchId } },
      select: { user: { select: { role: true, active: true } } }
    })
    if (!assignment || assignment.user.role !== 'BARBER' || !assignment.user.active) {
      badRequest('professionalId must be an active worker assigned to the branch')
    }
  }

  const overlap = await prisma.timeBlock.findFirst({
    where: {
      branchId,
      professionalId: professionalId || null,
      startTime: { lt: end },
      endTime: { gt: start }
    },
    select: { id: true }
  })
  if (overlap) badRequest('Time block overlaps an existing block')

  const timeBlock = await prisma.timeBlock.create({
    data: {
      branchId,
      professionalId: professionalId || null,
      startTime: start,
      endTime: end,
      allDay: allDay || false,
      reason,
      createdById: user.userId
    }
  })

  return timeBlock
})
