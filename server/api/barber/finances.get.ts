import { defineEventHandler, getQuery } from 'h3'
import { startOfWeek, addWeeks, formatISO } from 'date-fns'

import prisma from '~/server/utils/prisma'
import { getAuthUser } from '~/server/utils/permissions'
import { badRequest, forbidden } from '~/server/utils/errors'

// Read-only barber finance summary.
// NOTE: until we add a dedicated PAID state, we treat FINISHED as "paid".
export default defineEventHandler(async (event) => {
  const u = getAuthUser(event)
  if (u.role !== 'BARBER') forbidden('Forbidden')

  const q = getQuery(event)
  const weeks = q.weeks ? Number(q.weeks) : 8
  const branchId = (q.branchId as string | undefined) || undefined

  if (!Number.isFinite(weeks) || weeks < 1 || weeks > 52) {
    badRequest('weeks must be between 1 and 52')
  }

  const now = new Date()
  const end = addWeeks(startOfWeek(now, { weekStartsOn: 1 }), 1) // next Monday
  const start = addWeeks(end, -weeks)

  const appts = await prisma.appointment.findMany({
    where: {
      professionalId: u.userId,
      ...(branchId ? { branchId } : {}),
      startTime: { gte: start, lt: end },
      status: 'FINISHED'
    },
    select: {
      id: true,
      startTime: true
    }
  })

  const buckets = new Map<string, { weekStart: string; countPaidAppointments: number }>()

  for (let i = 0; i < weeks; i++) {
    const ws = addWeeks(start, i)
    const key = formatISO(ws, { representation: 'date' })
    buckets.set(key, { weekStart: key, countPaidAppointments: 0 })
  }

  for (const a of appts) {
    const ws = startOfWeek(a.startTime, { weekStartsOn: 1 })
    const key = formatISO(ws, { representation: 'date' })
    const b = buckets.get(key)
    if (b) b.countPaidAppointments += 1
  }

  return {
    range: {
      start: start.toISOString(),
      end: end.toISOString(),
      weeks
    },
    totals: {
      countPaidAppointments: appts.length
    },
    weeks: Array.from(buckets.values())
  }
})
