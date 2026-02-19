import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireParam } from '~/server/utils/http'
import { badRequest, notFound } from '~/server/utils/errors'

export default defineEventHandler(async (event) => {
  const id = requireParam(event, 'id')
  const { token } = getQuery(event)
  const t = String(token || '')
  if (!t) badRequest('token required')

  const apt = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true, confirmToken: true, confirmTokenExpiresAt: true, status: true }
  })
  if (!apt) notFound('Appointment not found')

  if (!apt.confirmToken || apt.confirmToken !== t) badRequest('invalid token')
  if (apt.confirmTokenExpiresAt && apt.confirmTokenExpiresAt.getTime() < Date.now()) badRequest('token expired')

  return prisma.appointment.update({
    where: { id },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      // public confirmation has no staff confirmer
      confirmedById: null,
      confirmToken: null,
      confirmTokenExpiresAt: null
    }
  })
})
