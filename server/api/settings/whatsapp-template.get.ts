import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

const TEMPLATE_NAME = 'whatsapp_appointment_message'
const DEFAULT_TEMPLATE = 'Hola {{nombre}}, te recordamos tu turno para el {{fecha}}. {{sucursal}}'

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN', 'MANAGER'])

  const tpl = await prisma.notificationTemplate.findUnique({
    where: { name: TEMPLATE_NAME },
    select: { body: true, updatedAt: true }
  })

  return {
    template: tpl?.body || DEFAULT_TEMPLATE,
    source: tpl ? 'db' : 'default',
    updatedAt: tpl?.updatedAt || null
  }
})
