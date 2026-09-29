import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { getAuthUser, requireRole } from '~/server/utils/permissions'
import { requireParam } from '~/server/utils/http'
import { notFound } from '~/server/utils/errors'
import { requireBranchAccess } from '~/server/utils/branchAccess'

export default defineEventHandler(async (event) => {
  const id = requireParam(event, 'id')
  // Only managers/admins can confirm appointments.
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])
  const user = getAuthUser(event)
  const existing = await prisma.appointment.findUnique({ where: { id }, select: { branchId: true } })
  if (!existing) notFound('Appointment not found')
  await requireBranchAccess(user, existing.branchId)

  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedById: user.userId
      }
    })
    return appointment
  } catch (e) {
    notFound('Appointment not found')
  }
})
