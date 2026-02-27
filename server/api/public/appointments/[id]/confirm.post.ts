import { defineEventHandler, getRequestURL } from 'h3'
import { format } from 'date-fns'
import crypto from 'node:crypto'
import prisma from '~/server/utils/prisma'
import { sendBookingConfirmationEmail } from '~/server/utils/mailer'
import { requireParam } from '~/server/utils/http'
import { badRequest, notFound } from '~/server/utils/errors'

const CONFIRM_TOKEN_TTL_MS = 1000 * 60 * 60 * 24
const RESEND_COOLDOWN_MS = 1000 * 60 * 2

export default defineEventHandler(async (event) => {
  const id = requireParam(event, 'id')

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      services: { include: { service: true } },
      client: { select: { email: true, firstName: true, lastName: true } },
      branch: { select: { name: true } }
    }
  })

  if (!appointment) notFound('Appointment not found')

  if (appointment.status === 'CONFIRMED' || appointment.status === 'IN_PROGRESS' || appointment.status === 'FINISHED' || appointment.status === 'PAID') {
    return { status: 'already_confirmed' as const }
  }
  if (appointment.status !== 'PENDING') {
    return { status: 'not_pending' as const }
  }

  const clientEmail = appointment.client?.email
  if (!clientEmail) {
    badRequest('client email required')
  }

  if (appointment.notifyEmail === false) {
    return { status: 'notifications_disabled' as const }
  }

  const now = Date.now()
  if (appointment.confirmTokenExpiresAt) {
    const expiresAt = appointment.confirmTokenExpiresAt.getTime()
    if (expiresAt - CONFIRM_TOKEN_TTL_MS + RESEND_COOLDOWN_MS > now) {
      return { status: 'rate_limited' as const }
    }
  }

  const confirmToken = appointment.confirmToken || crypto.randomUUID()
  const confirmTokenExpiresAt = new Date(now + CONFIRM_TOKEN_TTL_MS)

  await prisma.appointment.update({
    where: { id },
    data: {
      confirmToken,
      confirmTokenExpiresAt
    }
  })

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

  if (!result.ok) {
    return { status: 'send_failed' as const, error: result.error }
  }

  return { status: 'sent' as const }
})
