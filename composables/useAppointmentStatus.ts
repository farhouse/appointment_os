type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'FINISHED' | 'PAID' | 'CANCELED' | 'NO_SHOW'

export function useAppointmentStatus() {
  const { t, locale } = useI18n()

  const statusLabel = (status?: AppointmentStatus | string) => {
    if (!status) return ''
    return t(`appointments.status.${String(status).toLowerCase()}`)
  }

  const statusColor = (status?: AppointmentStatus | string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'info'
      case 'IN_PROGRESS':
        return 'primary'
      case 'FINISHED':
        return 'warning'
      case 'PAID':
        return 'success'
      case 'CANCELED':
        return 'neutral'
      case 'NO_SHOW':
        return 'error'
      default:
        return 'neutral'
    }
  }

  const formatDateTime = (value?: string | Date) => {
    if (!value) return ''
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const localeCode = locale.value === 'es-AR' ? 'es-AR' : 'en-US'
    return new Intl.DateTimeFormat(localeCode, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  }

  return {
    statusLabel,
    statusColor,
    formatDateTime
  }
}
