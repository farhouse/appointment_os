import { serverMisconfigured } from '~/server/utils/errors'
import { renderBookingConfirmationEmail } from '~/server/lib/email/bookingConfirmation'

type MailProvider = 'resend'

export type MailSendResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; status?: number }

export type BookingConfirmationEmailParams = {
  to: string
  clientName: string
  appointmentDateTime: string
  branchName: string
  servicesSummary: string
  confirmUrl: string
  expiresAtText: string
}

type MailConfig = {
  provider: MailProvider
  from: string
  replyTo?: string
  resendApiKey: string
  dryRun: boolean
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) serverMisconfigured(`${name} is required`)
  return value
}

function getMailConfig(): MailConfig {
  const provider = requireEnv('MAIL_PROVIDER') as MailProvider
  if (provider !== 'resend') {
    serverMisconfigured(`Unsupported MAIL_PROVIDER: ${provider}`)
  }

  return {
    provider,
    from: requireEnv('MAIL_FROM'),
    replyTo: process.env.MAIL_REPLY_TO,
    resendApiKey: requireEnv('RESEND_API_KEY'),
    dryRun: process.env.MAIL_DRY_RUN === 'true'
  }
}

export async function sendMail(params: {
  to: string | string[]
  subject: string
  html: string
  text: string
}): Promise<MailSendResult> {
  const config = getMailConfig()

  if (config.dryRun) {
    // eslint-disable-next-line no-console
    console.log('[mailer] dry run', {
      to: params.to,
      subject: params.subject
    })
    return { ok: true, id: 'dry_run' }
  }

  switch (config.provider) {
    case 'resend':
      return sendWithResend(config, params)
    default:
      serverMisconfigured(`Unsupported MAIL_PROVIDER: ${config.provider}`)
  }
}

export async function sendBookingConfirmationEmail(
  params: BookingConfirmationEmailParams
): Promise<MailSendResult> {
  const rendered = renderBookingConfirmationEmail({
    clientName: params.clientName,
    appointmentDateTime: params.appointmentDateTime,
    branchName: params.branchName,
    servicesSummary: params.servicesSummary,
    confirmUrl: params.confirmUrl,
    expiresAtText: params.expiresAtText
  })

  return sendMail({
    to: params.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text
  })
}

async function sendWithResend(
  config: MailConfig,
  params: { to: string | string[]; subject: string; html: string; text: string }
): Promise<MailSendResult> {
  const payload: Record<string, unknown> = {
    from: config.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text
  }

  if (config.replyTo) {
    payload.reply_to = config.replyTo
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  let responseBody: any = null
  try {
    responseBody = await response.json()
  } catch {
    responseBody = null
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error:
        responseBody?.message ||
        responseBody?.error ||
        `Resend error (${response.status})`
    }
  }

  return { ok: true, id: responseBody?.id }
}
