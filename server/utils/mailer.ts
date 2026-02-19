export async function sendBookingConfirmationEmail(params: {
  to: string
  confirmUrl: string
  appointmentId: string
}) {
  // TODO: integrate real email provider.
  // For now, log to server console so dev can test.
  // eslint-disable-next-line no-console
  console.log('[mailer] Booking confirmation', params)
}
