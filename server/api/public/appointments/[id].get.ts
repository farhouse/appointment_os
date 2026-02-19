import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireParam } from '~/server/utils/http'

// Public appointment lookup (used for /book/done).
// Note: intentionally minimal fields.
export default defineEventHandler(async (event) => {
  const id = requireParam(event, 'id')

  const apt = await prisma.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      branch: { select: { id: true, name: true, address: true } },
      professional: { select: { id: true, name: true } },
      services: { select: { service: { select: { id: true, name: true } } } }
    }
  })

  return apt
})
