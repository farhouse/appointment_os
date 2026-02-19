import { defineEventHandler, setHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireParam } from '~/server/utils/http'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatUtc(dt: Date) {
  // YYYYMMDDTHHMMSSZ
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}${pad(dt.getUTCSeconds())}Z`
}

function escapeIcs(s: string) {
  return (s || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

export default defineEventHandler(async (event) => {
  const id = requireParam(event, 'id')

  const apt = await prisma.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      branch: { select: { name: true, address: true } },
      professional: { select: { name: true } },
      services: { select: { service: { select: { name: true } } } }
    }
  })

  if (!apt) {
    setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
    return 'Not found'
  }

  const serviceNames = apt.services.map(s => s.service.name).join(', ')
  const title = `Turno — ${serviceNames}${apt.professional?.name ? ` (${apt.professional.name})` : ''}`
  const location = `${apt.branch?.name || ''}${apt.branch?.address ? ` — ${apt.branch.address}` : ''}`

  const dtStart = formatUtc(new Date(apt.startTime))
  const dtEnd = formatUtc(new Date(apt.endTime))
  const dtStamp = formatUtc(new Date())

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Barber OS//Booking//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-TIMEZONE:America/Argentina/Buenos_Aires',
    'BEGIN:VEVENT',
    `UID:${apt.id}@barber-os`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcs(title)}`,
    location ? `LOCATION:${escapeIcs(location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean)

  const body = lines.join('\r\n') + '\r\n'

  setHeader(event, 'Content-Type', 'text/calendar; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="appointment-${apt.id}.ics"`)

  return body
})
