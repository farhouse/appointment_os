import { z } from 'zod'

import { requireRole } from '~/server/utils/permissions'
import { readBodyValidated } from '~/server/utils/http'
import { sendMail } from '~/server/utils/mailer'

const schema = z.object({
  to: z.string().trim().email()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN'])

  const parsed = await readBodyValidated(event, schema)

  const result = await sendMail({
    to: parsed.to,
    subject: 'Email de prueba - AM OS',
    html: '<p>Este es un email de prueba enviado desde AM OS.</p>',
    text: 'Este es un email de prueba enviado desde AM OS.'
  })

  if (!result.ok) {
    return { ok: false, error: result.error, status: result.status }
  }

  return { ok: true, id: result.id }
})
