import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { z } from 'zod'
import { getAuthUser } from '~/server/utils/permissions'
import { readBodyValidated, requireParam } from '~/server/utils/http'
import { badRequest, forbidden, notFound } from '~/server/utils/errors'

const statusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'FINISHED', 'PAID', 'CANCELED', 'NO_SHOW']),
  cashBoxId: z.string().uuid().optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'OTHER']).optional(),
  amount: z.number().min(0).optional()
})

export default defineEventHandler(async (event) => {
  const u = getAuthUser(event)
  const id = requireParam(event, 'id')
  const validation = await readBodyValidated(event, statusSchema)

  // Only manager roles can update status.
  if (u.role !== 'OWNER' && u.role !== 'ADMIN' && u.role !== 'MANAGER') {
    forbidden('Forbidden')
  }

  if (validation.status !== 'PAID') {
    try {
      const appointment = await prisma.appointment.update({
        where: { id },
        data: { status: validation.status }
      })
      return appointment
    } catch (e) {
      notFound('Appointment not found')
    }
  }

  if (!validation.cashBoxId) {
    badRequest('cashBoxId required')
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { services: true }
  })
  if (!appointment) notFound('Appointment not found')

  const cashBox = await prisma.cashBox.findFirst({
    where: { id: validation.cashBoxId, active: true }
  })
  if (!cashBox) badRequest('Invalid cashBoxId')

  const computedAmount = appointment.services.reduce((acc, service) => acc + Number(service.price), 0)
  const finalAmount = validation.amount ?? computedAmount

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const paymentMethod = validation.paymentMethod ?? 'CASH'

  const client = prisma as any
  if (client.paymentMethodConfig) {
    const methodConfig = await client.paymentMethodConfig.findUnique({
      where: { method: paymentMethod }
    })
    if (methodConfig && !methodConfig.active) {
      badRequest('Payment method disabled')
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const session = await tx.cashSession.findFirst({
      where: {
        branchId: appointment.branchId,
        closingTime: null
      }
    })

    if (!session) {
      badRequest('Open cash session required')
    }

    const updatedAppointment = await tx.appointment.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paidById: u.userId,
        paidCashBoxId: validation.cashBoxId,
        paidPaymentMethod: paymentMethod as any,
        paidAmount: finalAmount as any
      } as any
    })

    if (updatedAppointment.clientId && finalAmount > 0) {
      const existingLedger = await tx.loyaltyLedger.findFirst({
        where: { appointmentId: updatedAppointment.id } as any
      })
      if (!existingLedger) {
        // Prefer service-configured points reward. Fallback: amount-based heuristic.
        const aptWithServices = await tx.appointment.findUnique({
          where: { id: updatedAppointment.id },
          include: { services: { include: { service: true } } }
        })

        const servicePoints = (aptWithServices?.services || []).reduce((acc: number, s: any) => acc + (s.service?.pointsReward || 0), 0)
        const points = servicePoints > 0 ? servicePoints : Math.floor(Number(finalAmount) / 1000)

        if (points > 0) {
          await tx.loyaltyLedger.create({
            data: {
              clientId: updatedAppointment.clientId,
              appointmentId: updatedAppointment.id,
              points,
              reason: `APPOINTMENT: ${updatedAppointment.id}`
            } as any
          })
        }
      }
    }

    await tx.cashMovement.create({
      data: {
        sessionId: session.id,
        appointmentId: id,
        amount: finalAmount as any,
        type: 'DEPOSIT',
        paymentMethod: paymentMethod as any
      } as any
    })

    return updatedAppointment
  })

  return result
})
