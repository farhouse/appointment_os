import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireQueryString } from '~/server/utils/http'

function getDayOfWeek(date: Date): number {
  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
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

function getWorkingHoursForDate(branchId: string, barberId: string | null, date: Date) {
  const dayOfWeek = getDayOfWeek(date)
  const dateStr = date.toISOString().split('T')[0]

  // Default fallback hours if no working hours configured
  const defaultStart = 9 * 60 // 09:00
  const defaultEnd = 19 * 60 // 19:00

  return { dayOfWeek, dateStr, defaultStart, defaultEnd }
}

export default defineEventHandler(async (event) => {
  const branchId = requireQueryString(event, 'branchId')
  const barberId = requireQueryString(event, 'barberId')
  const date = requireQueryString(event, 'date') // YYYY-MM-DD (local)

  const dayStart = new Date(`${date}T00:00:00.000`)
  const dayEnd = new Date(`${date}T23:59:59.999`)

  const appts = await prisma.appointment.findMany({
    where: {
      branchId,
      professionalId: barberId,
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
      status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
    },
    select: { startTime: true, endTime: true, status: true }
  })

  // Get working hours for this date
  const dayOfWeek = dayStart.getDay()
  let workingStart = 9 * 60 // 09:00 default
  let workingEnd = 19 * 60  // 19:00 default
  let isDayOff = false

  // Try to get barber-specific working hours first
  if (barberId) {
    const barberHours = await prisma.barberWorkingHour.findUnique({
      where: {
        userId_dayOfWeek: {
          userId: barberId,
          dayOfWeek
        }
      }
    })
    if (barberHours) {
      workingStart = parseTimeToMinutes(barberHours.startTime)
      workingEnd = parseTimeToMinutes(barberHours.endTime)
      isDayOff = !barberHours.isWorking
    }
  }

  // Fall back to branch hours if barber has no specific hours or no barber selected
  if (!barberId || !isDayOff) {
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
  }

  return {
    branchId,
    barberId,
    date,
    busy: appts,
    workingHours: isDayOff ? null : {
      start: minutesToTime(workingStart),
      end: minutesToTime(workingEnd)
    }
  }
})
