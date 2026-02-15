import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { z } from 'zod'
import { getAuthUser } from '~/server/utils/permissions'
import { readBodyValidated, requireParam } from '~/server/utils/http'
import { badRequest, forbidden, notFound } from '~/server/utils/errors'

const statusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'FINISHED', 'PAID', 'CANCELED', 'NO_SHOW']),
  cashBoxId: z.string().uuid().optional(),
  amount: z.number().positive().optional()
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

  const result = await prisma.$transaction(async (tx) => {
    const session = await tx.cashSession.upsert({
      where: { cashBoxId_date: { cashBoxId: validation.cashBoxId!, date: today } },
      update: {},
      create: {
        branchId: appointment.branchId,
        cashBoxId: validation.cashBoxId!,
        openedBy: u.userId,
        openingBalance: 0 as any,
        date: today
      }
    })

    const updatedAppointment = await tx.appointment.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paidById: u.userId,
        paidCashBoxId: validation.cashBoxId,
        paidAmount: finalAmount as any
      }
    })

    await tx.cashMovement.create({
      data: {
        sessionId: session.id,
        appointmentId: id,
        amount: finalAmount as any,
        type: 'DEPOSIT'
      }
    })

    return updatedAppointment
  })

  return result
})
