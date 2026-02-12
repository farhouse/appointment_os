import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { appointmentUpdateSchema } from '~/server/utils/schemas'
import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated, requireParam } from '~/server/utils/http'
import { notFound } from '~/server/utils/errors'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'MANAGER'])
  const id = requireParam(event, 'id')
  const validation = await readBodyValidated(event, appointmentUpdateSchema)

  // Handle service updates if present (complex logic, minimal impl here)
  // For MVP v1.1 just updating scalars
  // If services need update, we'd need to delete old relations and add new ones.
  // Skipping deep service update logic for this skeleton unless needed.

  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: validation
    })
    return appointment
  } catch (e) {
    notFound('Appointment not found')
  }
})
