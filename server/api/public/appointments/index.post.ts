import { defineEventHandler, getRequestURL } from 'h3'
import prisma from '~/server/utils/prisma'
import { sendBookingConfirmationEmail } from '~/server/utils/mailer'
import { appointmentSchema } from '~/server/utils/schemas'
import { readBodyValidated } from '~/server/utils/http'
import { badRequest } from '~/server/utils/errors'

import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const { serviceIds, ...data } = await readBodyValidated(event, appointmentSchema)

  // Prevent creating appointments in the past (client booking)
  const start = new Date(data.startTime)
  const end = new Date(data.endTime)
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    badRequest('Invalid startTime/endTime')
  }
  if (end <= start) {
    badRequest('endTime must be after startTime')
  }
  const now = new Date()
  // Small grace to avoid edge cases with clock skew
  const graceMs = 60 * 1000
  if (start.getTime() < now.getTime() - graceMs) {
    badRequest('Cannot book appointments in the past')
  }

  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } }
  })

  if (services.length !== serviceIds.length) {
    badRequest('One or more services not found')
  }

  // Public appointment creation always starts as PENDING (email confirmation)
  const confirmToken = crypto.randomUUID()
  const confirmTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24) // 24h

  const appointment = await prisma.appointment.create({
    data: {
      ...data,
      status: 'PENDING',
      confirmToken,
      confirmTokenExpiresAt,
      services: {
        create: services.map(s => ({
          serviceId: s.id,
          price: s.price,
          duration: s.duration
        }))
      }
    },
    include: {
      services: true,
      client: { select: { email: true } }
    }
  })

  // Send confirmation email (dev: logs to console)
  try {
    if ((appointment as any)?.client?.email) {
      const origin = getRequestURL(event).origin
      const confirmUrl = `${origin}/book/confirm/${appointment.id}?token=${encodeURIComponent(confirmToken)}`
      await sendBookingConfirmationEmail({
        to: (appointment as any).client.email,
        confirmUrl,
        appointmentId: appointment.id
      })
    }
  } catch {
    // don't fail booking if email fails
  }

  return appointment
})
