import { defineEventHandler, getRequestURL } from 'h3'
import { format } from 'date-fns'
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
      services: { include: { service: true } },
      client: { select: { email: true, firstName: true, lastName: true } },
      branch: { select: { name: true } }
    }
  })

  const confirmationEmail: {
    status: 'sent' | 'skipped' | 'failed'
    reason?: 'missing_email' | 'notifications_disabled'
    error?: string
  } = { status: 'skipped' }

  // Send confirmation email (do not block booking if it fails)
  const clientEmail = appointment.client?.email
  const shouldSendEmail = appointment.notifyEmail !== false && !!clientEmail
  if (!shouldSendEmail) {
    confirmationEmail.reason = appointment.notifyEmail === false
      ? 'notifications_disabled'
      : 'missing_email'
  } else {
    try {
      const clientName = [appointment.client?.firstName, appointment.client?.lastName]
        .filter(Boolean)
        .join(' ')
      const origin = getRequestURL(event).origin
      const confirmUrl = `${origin}/book/confirm/${appointment.id}?token=${encodeURIComponent(confirmToken)}`
      const appointmentDateTime = format(new Date(appointment.startTime), 'PPPP p')
      const servicesSummary = appointment.services
        .map(item => item.service?.name || 'Service')
        .join(', ')
      const expiresAtText = format(confirmTokenExpiresAt, 'PPPP p')

      const result = await sendBookingConfirmationEmail({
        to: clientEmail,
        clientName: clientName || 'Client',
        appointmentDateTime,
        branchName: appointment.branch?.name || 'BarberOS',
        servicesSummary: servicesSummary || 'Services booked',
        confirmUrl,
        expiresAtText: `on ${expiresAtText}`
      })

      if (result.ok) {
        confirmationEmail.status = 'sent'
      } else {
        confirmationEmail.status = 'failed'
        confirmationEmail.error = result.error
      }
    } catch (error) {
      confirmationEmail.status = 'failed'
      confirmationEmail.error = error instanceof Error ? error.message : 'Unknown error'
    }

    if (confirmationEmail.status === 'failed') {
      // eslint-disable-next-line no-console
      console.error('[booking] confirmation email failed', {
        appointmentId: appointment.id,
        error: confirmationEmail.error
      })
    }
  }

  return { ...appointment, confirmationEmail }
})
