import { defineEventHandler } from 'h3'
import { z } from 'zod'

import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/permissions'
import { readBodyValidated, requireParam } from '~/server/utils/http'
import { forbidden, notFound } from '~/server/utils/errors'

const notesSchema = z.object({
  notes: z.string().max(2000).nullable().optional()
})

export default defineEventHandler(async (event) => {
  const u = getAuthUser(event)
  const id = requireParam(event, 'id')
  const { notes } = await readBodyValidated(event, notesSchema)

  const appt = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true, professionalId: true }
  })

  if (!appt) {
    notFound('Appointment not found')
  }

  const canEdit =
    u.role === 'OWNER' ||
    u.role === 'ADMIN' ||
    u.role === 'MANAGER' ||
    (u.role === 'BARBER' && appt.professionalId && appt.professionalId === u.userId)

  if (!canEdit) {
    forbidden('Forbidden')
  }

  return prisma.appointment.update({
    where: { id },
    data: { notes: notes ?? null }
  })
})
