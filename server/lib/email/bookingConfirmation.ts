type BookingConfirmationTemplateParams = {
  clientName: string
  appointmentDateTime: string
  branchName: string
  servicesSummary: string
  confirmUrl: string
  expiresAtText: string
}

type BookingConfirmationTemplate = {
  subject: string
  html: string
  text: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderBookingConfirmationEmail(
  params: BookingConfirmationTemplateParams
): BookingConfirmationTemplate {
  const clientName = escapeHtml(params.clientName)
  const appointmentDateTime = escapeHtml(params.appointmentDateTime)
  const branchName = escapeHtml(params.branchName)
  const servicesSummary = escapeHtml(params.servicesSummary)
  const confirmUrl = escapeHtml(params.confirmUrl)
  const expiresAtText = escapeHtml(params.expiresAtText)

  const subject = `Confirm your appointment at ${branchName}`

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 10px 24px rgba(15,23,42,0.08);padding:32px;">
            <tr>
              <td style="font-size:20px;font-weight:600;">Hello ${clientName},</td>
            </tr>
            <tr>
              <td style="padding-top:16px;font-size:15px;line-height:22px;">
                Thanks for booking with <strong>${branchName}</strong>. Please confirm your appointment so we can reserve your slot.
              </td>
            </tr>
            <tr>
              <td style="padding-top:20px;font-size:15px;line-height:22px;">
                <strong>Appointment</strong><br />
                ${appointmentDateTime}
              </td>
            </tr>
            <tr>
              <td style="padding-top:12px;font-size:15px;line-height:22px;">
                <strong>Services</strong><br />
                ${servicesSummary}
              </td>
            </tr>
            <tr>
              <td style="padding-top:20px;">
                <a href="${confirmUrl}" style="display:inline-block;background-color:#0f172a;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-size:15px;">
                  Confirm appointment
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding-top:16px;font-size:13px;line-height:20px;color:#475569;">
                This link expires ${expiresAtText}. If you did not request this appointment, you can ignore this email.
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;font-size:13px;line-height:20px;color:#94a3b8;">
                Need help? Reply to this email and we will get back to you.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = `Hello ${params.clientName},

Thanks for booking with ${params.branchName}. Please confirm your appointment:

Appointment: ${params.appointmentDateTime}
Services: ${params.servicesSummary}

Confirm here: ${params.confirmUrl}

This link expires ${params.expiresAtText}.
If you did not request this appointment, you can ignore this email.`

  return { subject, html, text }
}
