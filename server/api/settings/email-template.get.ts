import prisma from '~/server/utils/prisma'
import { requireRole } from '~/server/utils/permissions'

const TEMPLATE_NAME = 'email_appointment_html'
const DEFAULT_TEMPLATE = `<html>
  <body style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
    <h2>Hola {{name}}</h2>
    <p>Te recordamos tu turno en <strong>{{branch}}</strong>.</p>
    <p><strong>Fecha:</strong> {{date}}</p>
    <p><strong>Servicios:</strong> {{services}}</p>
    <p>
      <a href="{{confirm_url}}" style="display:inline-block;padding:10px 14px;background:#111;color:#fff;text-decoration:none;border-radius:8px;">
        Confirmar turno
      </a>
    </p>
    <p style="font-size:12px;color:#555;">Este link vence {{expires_at}}.</p>
  </body>
</html>`

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN'])

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
