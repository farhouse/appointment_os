import { defineEventHandler } from 'h3'

import { requireRole } from '~/server/utils/permissions'

const allowedProviders = new Set(['resend'])

export default defineEventHandler(async (event) => {
  requireRole(event, ['OWNER', 'ADMIN'])

  const provider = process.env.MAIL_PROVIDER || null
  const from = process.env.MAIL_FROM || null
  const replyTo = process.env.MAIL_REPLY_TO || null
  const apiKey = process.env.RESEND_API_KEY || null
  const dryRun = process.env.MAIL_DRY_RUN === 'true'

  const providerActive = !!provider && allowedProviders.has(provider)

  return {
    provider,
    from,
    replyTo,
    providerActive,
    fromConfigured: !!from,
    replyToConfigured: !!replyTo,
    apiKeyConfigured: !!apiKey,
    dryRun,
    confirmation: {
      enabled: true,
      configurable: false,
      note: 'La confirmacion por email usa la configuracion actual del servidor.'
    }
  }
})
