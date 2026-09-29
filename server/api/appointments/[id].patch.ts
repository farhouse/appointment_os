import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { appointmentUpdateSchema } from '~/server/utils/schemas'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated, requireParam } from '~/server/utils/http'
import { badRequest, notFound } from '~/server/utils/errors'
import { requireBranchAccess } from '~/server/utils/branchAccess'

export default defineEventHandler(async (event) => {
  const u = requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])
  const id = requireParam(event, 'id')
  const validation = await readBodyValidated(event, appointmentUpdateSchema)

  const { serviceIds, ...data } = validation
  if (serviceIds !== undefined) {
    badRequest('Updating appointment services is not supported by this endpoint')
  }
  const existing = await prisma.appointment.findUnique({ where: { id }, select: { branchId: true } })
  if (!existing) notFound('Appointment not found')
  await requireBranchAccess(u, (data as any).branchId || existing.branchId)

  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data
    })
    return appointment
  } catch (e) {
    notFound('Appointment not found')
  }
})
