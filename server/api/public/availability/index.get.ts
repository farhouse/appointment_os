import { defineEventHandler, getQuery, createError } from 'h3'
import prisma from '~/server/utils/prisma'

function getDayOfWeek(date: Date): number {
  return date.getDay()
}

function parseTimeToMinutes(time: string): number {
  const parts = time.split(':')
  const hours = Number(parts[0])
  const minutes = Number(parts[1])
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function getSlotRanges(workingStart: number, workingEnd: number, busySlots: { startTime: Date; endTime: Date }[], duration: number): { start: string; end: string }[] {
  const ranges: { start: number; end: number }[] = []
  const stepMin = 15

  const busyMinutes = busySlots.map(b => ({
    start: b.startTime.getHours() * 60 + b.startTime.getMinutes(),
    end: b.endTime.getHours() * 60 + b.endTime.getMinutes()
  }))

  for (let cur = workingStart; cur + duration <= workingEnd; cur += stepMin) {
    const slotStart = cur
    const slotEnd = cur + duration

    const isBusy = busyMinutes.some(busy => slotStart < busy.end && slotEnd > busy.start)

    if (!isBusy) {
      ranges.push({ start: slotStart, end: slotEnd })
    }
  }

  return ranges.map(r => ({ start: minutesToTime(r.start), end: minutesToTime(r.end) }))
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const branchId = query.branchId as string
  const barberId = (query.barberId as string) || null
  const date = query.date as string

  if (!branchId || !date) {
    throw createError({ statusCode: 400, statusMessage: 'branchId and date are required' })
  }

  const dayStart = new Date(`${date}T00:00:00.000`)
  const dayEnd = new Date(`${date}T23:59:59.999`)

  const appointmentWhere: any = {
    branchId,
    startTime: { lt: dayEnd },
    endTime: { gt: dayStart },
    status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
  }
  if (barberId) {
    appointmentWhere.professionalId = barberId
  }

  const appts = await prisma.appointment.findMany({
    where: appointmentWhere,
    select: { startTime: true, endTime: true, status: true }
  })

  const blockWhere: any = {
    branchId,
    startTime: { lt: dayEnd },
    endTime: { gt: dayStart }
  }
  
  if (barberId) {
    blockWhere.OR = [
      { professionalId: barberId },
      { professionalId: null }
    ]
  }

  const blocks = await prisma.timeBlock.findMany({
    where: blockWhere,
    select: { startTime: true, endTime: true, reason: true } // Select reason if needed for debug
  })

  // Combine busy slots
  const combinedBusy = [
    ...appts.map(a => ({ startTime: a.startTime, endTime: a.endTime })),
    ...blocks.map(b => ({ startTime: b.startTime, endTime: b.endTime }))
  ]

  const dayOfWeek = dayStart.getDay()
  let workingStart = 9 * 60
  let workingEnd = 19 * 60
  let isDayOff = false

  let hasBarberHours = false
  if (barberId) {
    try {
      const barberHours = await prisma.barberWorkingHour.findUnique({
        where: {
          userId_dayOfWeek: {
            userId: barberId,
            dayOfWeek
          }
        }
      })
      if (barberHours) {
        hasBarberHours = true
        workingStart = parseTimeToMinutes(barberHours.startTime)
        workingEnd = parseTimeToMinutes(barberHours.endTime)
        isDayOff = !barberHours.isWorking
      }
    } catch {
      hasBarberHours = false
    }
  }

  // Branch schedule is fallback when there is no explicit barber schedule for that weekday.
  if (!hasBarberHours) {
    try {
      const branchHours = await prisma.branchWorkingHour.findUnique({
        where: {
          branchId_dayOfWeek: {
            branchId,
            dayOfWeek
          }
        }
      })
      if (branchHours) {
        workingStart = parseTimeToMinutes(branchHours.startTime)
        workingEnd = parseTimeToMinutes(branchHours.endTime)
        isDayOff = !branchHours.isWorking
      }
    } catch {
      // Backward compatibility when BranchWorkingHour is not yet migrated.
    }
  }

  const busyForDisplay = [
    ...appts.map(a => ({
      startTime: a.startTime.toISOString(),
      endTime: a.endTime.toISOString(),
      status: a.status
    })),
    ...blocks.map(b => ({
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
      status: 'BLOCKED',
      reason: b.reason
    }))
  ]

  return {
    branchId,
    barberId,
    date,
    dayOfWeek,
    isDayOff,
    workingHours: isDayOff ? null : {
      start: minutesToTime(workingStart),
      end: minutesToTime(workingEnd)
    },
    busy: busyForDisplay,
    available: isDayOff ? [] : getSlotRanges(workingStart, workingEnd, combinedBusy, 30)
  }
})
