<script setup lang="ts">
import type { VueCalEvent, VueCalView } from 'vue-cal'
import { useSelectedBranch } from '~/composables/useSelectedBranch'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN', 'MANAGER'],
})

const { selectedBranchId } = useSelectedBranch()

const { locale, t } = useI18n()
const { statusLabel } = useAppointmentStatus()
const toast = useToast()

const calendarView = ref<VueCalView | null>(null)
const calendarApiView = ref<VueCalView | null>(null)
const calendarPayload = ref<any | null>(null)
const calendarEvents = ref<VueCalEvent[]>([])
const isEventsLoading = ref(false)
const currentView = ref<'day' | 'week' | 'month'>('day')

const barbers = ref<{ id: string; name: string }[]>([])

const isCreateModalOpen = ref(false)
const createInitialStart = ref<string | null>(null)

function openCreateModal(start?: Date | string | null) {
  if (start) {
    const d = start instanceof Date ? start : new Date(start)
    createInitialStart.value = Number.isNaN(d.getTime()) ? null : d.toISOString()
  } else {
    createInitialStart.value = null
  }
  isCreateModalOpen.value = true
}

function refreshCalendar() {
  if (calendarView.value) void loadEvents(calendarView.value, selectedBranchId.value)
}

const calendarConfig = computed(() => ({
  view: currentView.value,
  titleBar: false,
  viewsBar: false,
  todayButton: false,
  timeFrom: 8 * 60,
  timeTo: 20 * 60,
  // Make rows taller so appointments are easier to read (more scrolling, less compression).
  timeCellHeight: 70,
  editableEvents: true,
  events: calendarEvents.value,
  // Schedules = columns (one per barber) for day/week views.
  ...(barbers.value.length && (currentView.value === 'day' || currentView.value === 'week')
    ? { schedules: barbers.value.map(b => ({ id: b.id, label: b.name })) }
    : {}),
  locale: locale.value === 'es-AR' ? 'es' : 'en-us'
}))

const viewOptions = [
  { id: 'day', label: 'calendar.day' },
  { id: 'week', label: 'calendar.week' },
  { id: 'month', label: 'calendar.month' }
]

async function loadBarbers(branchId?: string | null) {
  if (!branchId) {
    barbers.value = []
    return
  }
  try {
    // Reuse public endpoint (active barbers assigned to the branch).
    barbers.value = await $fetch(`/api/public/barbers?branchId=${encodeURIComponent(branchId)}`)
  } catch {
    barbers.value = []
  }
}

watch([calendarView, selectedBranchId], ([view, branchId]) => {
  if (!view) return
  void loadEvents(view, branchId)
  void loadBarbers(branchId)
})

watch([calendarPayload, selectedBranchId], ([payload, branchId]) => {
  if (!payload?.start || !payload?.end) return
  void loadEvents({ start: payload.start, end: payload.end } as any, branchId)
})

watch(locale, () => {
  if (calendarView.value) void loadEvents(calendarView.value, selectedBranchId.value)
})

// Keep calendar fresh: new appointments can be created from other tabs/pages.
let refreshTimer: any
onMounted(() => {
  void loadWhatsappTemplate()

  refreshTimer = setInterval(() => {
    if (calendarView.value) void loadEvents(calendarView.value, selectedBranchId.value)
  }, 15000)

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && calendarView.value) void loadEvents(calendarView.value, selectedBranchId.value)
  })
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

async function loadEvents(view: VueCalView, branchId?: string | null) {
  const query = new URLSearchParams({
    start: view.start.toISOString(),
    end: view.end.toISOString()
  })
  if (branchId) query.set('branchId', branchId)
  isEventsLoading.value = true
  try {
    const events = await $fetch(`/api/calendar/events?${query.toString()}`)
    const parsed = ((events as any[]) || []).map((e) => ({
      ...e,
      // VueCal is picky: ensure start/end are actual Date instances.
      start: e?.start ? new Date(e.start) : e.start,
      end: e?.end ? new Date(e.end) : e.end,
    }))
    calendarEvents.value = parsed as VueCalEvent[]
  } catch {
    calendarEvents.value = []
  } finally {
    isEventsLoading.value = false
  }
}

const calendarKey = computed(() => `${currentView.value}-${locale.value}`)

const selectedEvent = ref<any | null>(null)
const detailModalOpen = ref(false)
const whatsappTemplate = ref('Hola {{nombre}}, te recordamos tu turno para el {{fecha}}. {{sucursal}}')
const editableNotes = ref('')
const editableStart = ref('')
const isSavingNotes = ref(false)
const isMovingAppointment = ref(false)

const selectedClientPhone = computed(() => {
  const raw = selectedEvent.value?.extendedProps?.client?.phone
  if (!raw) return ''
  return String(raw).trim()
})

async function loadWhatsappTemplate() {
  try {
    const response = await $fetch('/api/settings/whatsapp-template')
    if (response?.template) whatsappTemplate.value = response.template
  } catch {
    // keep default template
  }
}

function buildWhatsappMessage(template?: string) {
  const clientName = selectedEvent.value?.extendedProps?.client?.firstName || 'cliente'
  const branchName = selectedEvent.value?.extendedProps?.branch?.name || ''
  const start = selectedEvent.value?.start
  const dateText = start ? new Date(start).toLocaleString('es-AR') : ''

  const raw = (template || 'Hola {{nombre}}, te recordamos tu turno para el {{fecha}}. {{sucursal}}').trim()
  return raw
    .replaceAll('{{nombre}}', clientName)
    .replaceAll('{{fecha}}', dateText)
    .replaceAll('{{sucursal}}', branchName ? `Sucursal: ${branchName}` : '')
    .replaceAll('  ', ' ')
    .trim()
}

const whatsappHref = computed(() => {
  const phone = selectedClientPhone.value.replace(/\D/g, '')
  if (!phone) return ''
  const message = encodeURIComponent(buildWhatsappMessage(whatsappTemplate.value))
  return `https://wa.me/${phone}?text=${message}`
})
const payModalOpen = ref(false)
const isConfirming = ref(false)
const isUpdatingStatus = ref(false)

const cashBoxes = ref<{ id: string; name: string }[]>([])
const paymentMedia = ref<{ id: string; method: string; name: string; active: boolean }[]>([])
const isPaying = ref(false)
const payError = ref('')
const hasOpenCashSession = ref(true)
const isCheckingCashSession = ref(false)

const payForm = reactive({
  cashBoxId: '',
  paymentMethod: 'CASH',
  paymentMediumId: '',
  amount: 0
})

async function loadCashBoxes() {
  if (!selectedBranchId.value) return
  try {
    const query = new URLSearchParams({ branchId: selectedBranchId.value, activeOnly: 'true' })
    cashBoxes.value = await $fetch(`/api/cashboxes?${query.toString()}`)
  } catch {
    cashBoxes.value = []
  }
}

async function loadPaymentMedia() {
  try {
    const response = await $fetch('/api/settings/payment-methods')
    paymentMedia.value = (response?.media || []).filter((m: any) => m.active)
  } catch {
    paymentMedia.value = []
  }
}

function overlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart
}

function getMediumDisplayName(name: string) {
  const upper = (name || '').toUpperCase().trim()
  if (upper === 'CASH') return 'Efectivo'
  if (upper === 'CARD' || upper === 'CREDIT' || upper === 'DEBIT') return 'Tarjeta'
  if (upper === 'TRANSFER' || upper === 'TRANSFERENCIA') return 'Transferencia'
  if (upper === 'OTHER' || upper === 'OTRO') return 'Otro'
  return name
}

function statusBadgeColor(status: string | undefined) {
  switch (status) {
    case 'PENDING': return 'warning'
    case 'CONFIRMED': return 'info'
    case 'IN_PROGRESS': return 'primary'
    case 'FINISHED': return 'success'
    case 'PAID': return 'success'
    case 'CANCELED': return 'error'
    case 'NO_SHOW': return 'error'
    default: return 'neutral'
  }
}

function formatCurrency(value: any) {
  if (value == null) return '—'
  const n = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(n)) return String(value)
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })
}

const MOVE_BLOCK_MINUTES = 10

function snapDateToBlock(date: Date, blockMinutes = MOVE_BLOCK_MINUTES) {
  const ms = blockMinutes * 60 * 1000
  return new Date(Math.round(date.getTime() / ms) * ms)
}

function toLocalDateTimeInput(value?: string | Date | null) {
  if (!value) return ''
  const raw = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(raw.getTime())) return ''
  const d = snapDateToBlock(raw)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

const payMediaOptions = computed(() => paymentMedia.value)

const selectedPayMethodLabel = computed(() => {
  switch (payForm.paymentMethod) {
    case 'CARD': return t('manager.cash.methodCard')
    case 'TRANSFER': return t('manager.cash.methodTransfer')
    case 'OTHER': return t('manager.cash.methodOther')
    default: return t('manager.cash.methodCash')
  }
})

watch(() => payForm.paymentMediumId, (mediumId) => {
  const medium = paymentMedia.value.find(m => m.id === mediumId)
  if (medium?.method) {
    payForm.paymentMethod = medium.method as any
  }
})

watch(() => payForm.cashBoxId, () => {
  if (payModalOpen.value) {
    void precheckOpenCashSession()
  }
})

function openDetailModal(event: any) {
  selectedEvent.value = event
  editableNotes.value = event?.extendedProps?.notes || ''
  editableStart.value = toLocalDateTimeInput(event?.start)
  detailModalOpen.value = true
}

function closeDetailModal() {
  detailModalOpen.value = false
  selectedEvent.value = null
  editableNotes.value = ''
  editableStart.value = ''
}

async function saveNotes() {
  if (!selectedEvent.value?.id) return
  isSavingNotes.value = true
  try {
    await $fetch(`/api/appointments/${selectedEvent.value.id}/notes`, {
      method: 'PATCH',
      body: { notes: editableNotes.value || null }
    })
    toast.add({ title: 'Notas actualizadas', color: 'success' })
    if (calendarView.value) await loadEvents(calendarView.value, selectedBranchId.value)
    selectedEvent.value = {
      ...selectedEvent.value,
      extendedProps: {
        ...selectedEvent.value.extendedProps,
        notes: editableNotes.value
      }
    }
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || 'No se pudieron guardar las notas', color: 'error' })
  } finally {
    isSavingNotes.value = false
  }
}

async function moveFromModal() {
  if (!selectedEvent.value?.id || !editableStart.value) return
  const newStart = snapDateToBlock(new Date(editableStart.value))
  const currentStart = new Date(selectedEvent.value.start)
  const currentEnd = new Date(selectedEvent.value.end)
  const durationMs = Math.max(15 * 60 * 1000, currentEnd.getTime() - currentStart.getTime())
  const newEnd = new Date(newStart.getTime() + durationMs)

  isMovingAppointment.value = true
  try {
    await $fetch(`/api/appointments/${selectedEvent.value.id}/move`, {
      method: 'PATCH',
      body: {
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
        professionalId: selectedEvent.value?.extendedProps?.professional?.id || undefined
      }
    })
    toast.add({ title: 'Turno reprogramado', color: 'success' })
    if (calendarView.value) await loadEvents(calendarView.value, selectedBranchId.value)
    closeDetailModal()
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || 'No se pudo reprogramar', color: 'error' })
  } finally {
    isMovingAppointment.value = false
  }
}

async function confirmAppointment() {
  if (!selectedEvent.value?.id) return
  isConfirming.value = true
  try {
    await $fetch(`/api/appointments/${selectedEvent.value.id}/confirm`, { method: 'PATCH' })
    if (calendarView.value) void loadEvents(calendarView.value, selectedBranchId.value)
    closeDetailModal()
  } catch (e: any) {
    // keep it simple for now; surface basic error
    payError.value = e?.data?.statusMessage || e?.data?.message || 'No se pudo confirmar'
  } finally {
    isConfirming.value = false
  }
}

async function setAppointmentStatus(status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED' | 'NO_SHOW') {
  if (!selectedEvent.value?.id) return
  isUpdatingStatus.value = true
  payError.value = ''
  try {
    await $fetch(`/api/appointments/${selectedEvent.value.id}/status`, {
      method: 'PATCH',
      body: { status }
    })
    if (calendarView.value) void loadEvents(calendarView.value, selectedBranchId.value)
    closeDetailModal()
  } catch (e: any) {
    payError.value = e?.data?.statusMessage || e?.data?.message || 'No se pudo actualizar el estado'
  } finally {
    isUpdatingStatus.value = false
  }
}

function openPayModal() {
  if (!selectedEvent.value) return
  payModalOpen.value = true
  payError.value = ''
  hasOpenCashSession.value = true
  const totalPrice = Number(selectedEvent.value?.extendedProps?.totalPrice ?? 0)
  payForm.amount = Number.isFinite(totalPrice) ? totalPrice : 0
  if (!cashBoxes.value.length) void loadCashBoxes()
  if (!paymentMedia.value.length) void loadPaymentMedia()
  const firstMedium = paymentMedia.value.find((m: any) => m.active)
  payForm.paymentMediumId = firstMedium?.id || ''
  payForm.paymentMethod = (firstMedium?.method as any) || 'CASH'
  void precheckOpenCashSession()
}
function closePayModal() {
  payModalOpen.value = false
  payError.value = ''
  payForm.amount = 0
  payForm.cashBoxId = ''
  const firstMedium = paymentMedia.value.find((m: any) => m.active)
  payForm.paymentMediumId = firstMedium?.id || ''
  payForm.paymentMethod = (firstMedium?.method as any) || 'CASH'
  hasOpenCashSession.value = true
}

async function precheckOpenCashSession() {
  const branchId = selectedBranchId.value
  if (!branchId) return true
  isCheckingCashSession.value = true
  try {
    const query = new URLSearchParams({ branchId })
    if (payForm.cashBoxId) query.set('cashBoxId', payForm.cashBoxId)
    const session = await $fetch(`/api/cash/sessions/current?${query.toString()}`)
    const hasSession = Boolean(session)
    hasOpenCashSession.value = hasSession
    if (!hasSession) {
      payError.value = 'Abrí caja primero'
    }
    return hasSession
  } catch {
    hasOpenCashSession.value = true
    return true
  } finally {
    isCheckingCashSession.value = false
  }
}

async function confirmPayment() {
  if (!selectedEvent.value?.id || !payForm.cashBoxId) return
  payError.value = ''
  const hasSession = await precheckOpenCashSession()
  if (!hasSession) return
  const selectedMedium = paymentMedia.value.find((m: any) => m.id === payForm.paymentMediumId)
  const paymentMethod = (selectedMedium?.method as any) || payForm.paymentMethod

  isPaying.value = true
  try {
    await $fetch(`/api/appointments/${selectedEvent.value.id}/status`, {
      method: 'PATCH',
      body: {
        status: 'PAID',
        cashBoxId: payForm.cashBoxId,
        paymentMethod,
        paymentMediumId: payForm.paymentMediumId || undefined,
        amount: payForm.amount
      }
    })
    if (calendarView.value) void loadEvents(calendarView.value, selectedBranchId.value)
    closePayModal()
    closeDetailModal()
  } catch (e: any) {
    payError.value = e?.data?.statusMessage || 'No se pudo cobrar'
  } finally {
    isPaying.value = false
  }
}

function handleReady({ view }: { view: VueCalView }) {
  calendarView.value = view
  calendarApiView.value = view
  calendarPayload.value = {
    id: view.id,
    title: view.title,
    start: view.start,
    end: view.end
  }
}

function handleViewChange(payload: any) {
  calendarPayload.value = payload
  if (payload?.id === 'day' || payload?.id === 'week' || payload?.id === 'month') {
    currentView.value = payload.id
  }
}

function handleEventClick(e: any) {
  const event = e?.event || e
  if (!event) return
  openDetailModal(event)
}

function handleCellClick(payload: any) {
  const start = payload?.start || payload?.date || payload
  if (!start) return
  openCreateModal(start)
}

function getEventPayload(event: VueCalEvent, schedule?: string) {
  if (!event.start || !event.end) return null
  const originalStart = new Date(event.start)
  const originalEnd = new Date(event.end)
  const durationMs = originalEnd.getTime() - originalStart.getTime()
  const snappedStart = snapDateToBlock(originalStart)
  const snappedEnd = new Date(snappedStart.getTime() + durationMs)

  return {
    startTime: snappedStart.toISOString(),
    endTime: snappedEnd.toISOString(),
    ...(schedule ? { professionalId: schedule } : {})
  }
}

async function handleEventDropped({ event, originalEvent }: { event: VueCalEvent; originalEvent?: VueCalEvent }) {
  if (!event?.id) return
  const schedule = (event as any)?.schedule
  const payload = getEventPayload(event, schedule)
  if (!payload) return

  // Check for potential conflicts if professional is assigned
  let hasConflict = false
  if (schedule) {
    const conflictingEvents = calendarEvents.value.filter(e =>
      e.id !== event.id &&
      e.extendedProps?.status &&
      !['CANCELED', 'NO_SHOW'].includes(e.extendedProps.status) &&
      (e as any).schedule === schedule &&
      overlap(new Date(event.start), new Date(event.end), new Date(e.start), new Date(e.end))
    )
    hasConflict = conflictingEvents.length > 0
  }

  const confirmMessage = hasConflict ? t('calendar.confirmMoveConflict') : t('calendar.confirmMove')
  if (!confirm(confirmMessage)) {
    if (calendarView.value) void loadEvents(calendarView.value, selectedBranchId.value)
    return
  }

  try {
    await $fetch(`/api/appointments/${event.id}/move`, {
      method: 'PATCH',
      body: payload
    })
    toast.add({ title: t('calendar.moveSuccess'), color: 'success' })
    if (calendarView.value) void loadEvents(calendarView.value, selectedBranchId.value)
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || t('calendar.moveError'), color: 'error' })
    if (calendarView.value) void loadEvents(calendarView.value, selectedBranchId.value)
    if (originalEvent) {
      event.start = originalEvent.start
      event.end = originalEvent.end
      if ((originalEvent as any)?.schedule) {
        ;(event as any).schedule = (originalEvent as any).schedule
      }
    }
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">{{ $t('pages.private.managerCalendar') }}</h1>
    <div class="bg-white p-4 rounded-lg shadow mt-4 text-gray-900 h-[calc(100vh-220px)] min-h-[600px] flex flex-col">
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <UButton
          v-if="selectedBranchId"
          icon="i-heroicons-plus"
          color="primary"
          @click="openCreateModal()"
        >
          Nuevo
        </UButton>
        <div v-if="isEventsLoading" class="flex items-center gap-2 text-xs text-stone-500">
          <span class="inline-block size-3 rounded-full border-2 border-stone-400 border-t-transparent animate-spin" aria-hidden="true" />
          <span>Cargando turnos…</span>
        </div>
        <div class="flex gap-2">
          <button
            v-for="option in viewOptions"
            :key="option.id"
            type="button"
            class="px-3 py-1 rounded border text-sm"
            :class="currentView === option.id ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-700'"
            @click="currentView = option.id"
          >
            {{ $t(option.label) }}
          </button>
        </div>
        <div class="flex gap-2">
          <button type="button" class="px-3 py-1 rounded border border-gray-300 text-sm" @click="calendarApiView?.previous()">
            {{ $t('calendar.labels.previous') }}
          </button>
          <button type="button" class="px-3 py-1 rounded border border-gray-300 text-sm" @click="calendarApiView?.goToToday()">
            {{ $t('calendar.labels.today') }}
          </button>
          <button type="button" class="px-3 py-1 rounded border border-gray-300 text-sm" @click="calendarApiView?.next()">
            {{ $t('calendar.labels.next') }}
          </button>
        </div>
        <div class="ml-auto text-sm font-semibold">
          {{ calendarPayload?.title || calendarView?.title || '' }}
        </div>
      </div>
      <VueCalClient
        :key="calendarKey"
        :config="calendarConfig"
        class="flex-1 min-h-0"
        @ready="handleReady"
        @view-change="handleViewChange"
        @event-click="handleEventClick"
        @cell-click="handleCellClick"
        @event-dropped="handleEventDropped"
      />
    </div>

    <!-- Detail modal (event click) -->
    <div v-if="detailModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="closeDetailModal">
      <div class="w-full max-w-lg rounded-lg bg-white p-4 shadow-lg">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="text-lg font-semibold truncate">{{ $t('calendar.eventAlert') }}</div>
            <div class="text-sm text-gray-600 mt-1">{{ selectedEvent?.title }}</div>
          </div>
          <button class="text-sm text-gray-500 hover:text-gray-800" type="button" @click="closeDetailModal">✕</button>
        </div>

        <div class="mt-4 space-y-3 text-sm">
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded border border-gray-200 p-2">
              <div class="text-xs text-gray-500">Inicio</div>
              <div class="font-medium text-gray-900">{{ formatDateTime(selectedEvent?.start) }}</div>
            </div>
            <div class="rounded border border-gray-200 p-2">
              <div class="text-xs text-gray-500">Fin</div>
              <div class="font-medium text-gray-900">{{ formatDateTime(selectedEvent?.end) }}</div>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="font-medium text-gray-700">{{ $t('calendar.status') }}</span>
            <UBadge :color="statusBadgeColor(selectedEvent?.extendedProps?.status)">
              {{ statusLabel(selectedEvent?.extendedProps?.status) }}
            </UBadge>
          </div>

          <div v-if="selectedEvent?.extendedProps?.professional || selectedEvent?.extendedProps?.branch" class="grid grid-cols-2 gap-3">
            <div v-if="selectedEvent?.extendedProps?.professional" class="rounded bg-gray-50 p-2">
              <div class="text-xs text-gray-500">Profesional</div>
              <div class="font-medium text-gray-900">{{ selectedEvent.extendedProps.professional.name }}</div>
            </div>
            <div v-if="selectedEvent?.extendedProps?.branch" class="rounded bg-gray-50 p-2">
              <div class="text-xs text-gray-500">Sucursal</div>
              <div class="font-medium text-gray-900">{{ selectedEvent.extendedProps.branch.name }}</div>
            </div>
          </div>

          <div v-if="selectedEvent?.extendedProps?.client" class="rounded bg-gray-50 p-3 space-y-2">
            <div class="font-medium text-gray-900">Cliente</div>
            <div class="text-sm">
              <div>{{ selectedEvent.extendedProps.client.firstName }} {{ selectedEvent.extendedProps.client.lastName }}</div>
              <div v-if="selectedEvent.extendedProps.client.phone" class="text-gray-500">{{ selectedEvent.extendedProps.client.phone }}</div>
              <div v-if="selectedEvent.extendedProps.client.email" class="text-gray-500">{{ selectedEvent.extendedProps.client.email }}</div>
            </div>
          </div>

          <div v-if="selectedEvent?.extendedProps?.services?.length" class="space-y-2">
            <div class="font-medium text-gray-700">Servicios</div>
            <div class="rounded border border-gray-200 divide-y divide-gray-200">
              <div
                v-for="service in selectedEvent.extendedProps.services"
                :key="service.id"
                class="flex justify-between items-center py-2 px-3 text-sm"
              >
                <span class="text-gray-900">{{ service.name }}</span>
                <span class="text-gray-600">{{ formatCurrency(service.price) }}</span>
              </div>
            </div>
            <div class="flex justify-between items-center py-2 px-3 bg-gray-50 rounded font-medium">
              <span>Total</span>
              <span class="text-lg">{{ formatCurrency(selectedEvent?.extendedProps?.totalPrice) }}</span>
            </div>
          </div>

          <div class="rounded border border-gray-200 p-3 space-y-2">
            <div class="font-medium text-gray-700">Reprogramar</div>
            <input v-model="editableStart" type="datetime-local" step="600" class="w-full rounded border border-gray-300 px-3 py-2" />
            <div class="flex justify-end">
              <UButton size="sm" variant="outline" :loading="isMovingAppointment" @click="moveFromModal">Guardar nueva hora</UButton>
            </div>
          </div>

          <div class="rounded border border-gray-200 p-3 space-y-2">
            <div class="font-medium text-gray-700">Notas</div>
            <UTextarea v-model="editableNotes" :rows="3" />
            <div class="flex justify-end">
              <UButton size="sm" variant="outline" :loading="isSavingNotes" @click="saveNotes">Guardar notas</UButton>
            </div>
          </div>
        </div>

        <div class="mt-4 flex justify-end gap-2 flex-wrap">
          <UButton
            v-if="whatsappHref"
            :to="whatsappHref"
            target="_blank"
            rel="noopener noreferrer"
            color="success"
            variant="outline"
            icon="i-simple-icons-whatsapp"
          >
            WhatsApp
          </UButton>

          <UButton variant="outline" @click="closeDetailModal">{{ $t('common.close') }}</UButton>

          <!-- Status transitions (manager/admin) -->
          <UButton
            v-if="selectedEvent?.extendedProps?.status === 'PENDING'"
            color="primary"
            :loading="isConfirming"
            @click="confirmAppointment"
          >
            Confirmar
          </UButton>

          <UButton
            v-if="selectedEvent?.extendedProps?.status === 'CONFIRMED'"
            color="primary"
            :loading="isUpdatingStatus"
            @click="setAppointmentStatus('IN_PROGRESS')"
          >
            Iniciar
          </UButton>

          <UButton
            v-if="selectedEvent?.extendedProps?.status === 'IN_PROGRESS'"
            color="primary"
            :loading="isUpdatingStatus"
            @click="setAppointmentStatus('FINISHED')"
          >
            Finalizar
          </UButton>

          <UButton
            v-if="['PENDING','CONFIRMED','IN_PROGRESS'].includes(selectedEvent?.extendedProps?.status)"
            variant="outline"
            :loading="isUpdatingStatus"
            @click="setAppointmentStatus('NO_SHOW')"
          >
            {{ $t('appointments.status.no_show') }}
          </UButton>

          <UButton
            v-if="['PENDING','CONFIRMED'].includes(selectedEvent?.extendedProps?.status)"
            variant="outline"
            :loading="isUpdatingStatus"
            @click="setAppointmentStatus('CANCELED')"
          >
            Cancelar
          </UButton>

          <UButton
            color="primary"
            :disabled="selectedEvent?.extendedProps?.status !== 'FINISHED'"
            @click="openPayModal"
          >
            {{ $t('pages.private.manager.pay.open') }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Pay modal (opened from detail) -->
    <div v-if="payModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="closePayModal">
      <div class="w-full max-w-lg rounded-lg bg-white p-4 shadow-lg">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="text-lg font-semibold truncate">{{ $t('pages.private.manager.pay.title') }}</div>
            <div class="text-sm text-gray-600 mt-1">{{ selectedEvent?.title }}</div>
          </div>
          <button class="text-sm text-gray-500 hover:text-gray-800" type="button" @click="closePayModal">✕</button>
        </div>

        <div class="mt-4 space-y-4 text-sm">
          <!-- Session warning -->
          <div v-if="!hasOpenCashSession" class="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div class="flex items-start gap-3">
              <div class="i-lucide-alert-triangle text-amber-500 text-xl mt-0.5" />
              <div class="flex-1">
                <div class="font-medium text-amber-800">Caja cerrada</div>
                <div class="text-sm text-amber-700 mt-1">
                  No hay una sesión de caja abierta para esta sucursal. Abrí una caja para poder cobrar.
                </div>
                <UButton
                  to="/private/backoffice/cash"
                  color="warning"
                  variant="solid"
                  size="sm"
                  class="mt-3"
                >
                  Ir a Caja
                </UButton>
              </div>
            </div>
          </div>
          <div v-else>
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ $t('pages.private.manager.pay.cashbox') }}</label>
              <select v-model="payForm.cashBoxId" class="mt-1 w-full rounded border border-gray-300 px-3 py-2">
                <option value="" disabled>{{ $t('pages.private.manager.pay.selectCashbox') }}</option>
                <option v-for="cb in cashBoxes" :key="cb.id" :value="cb.id">
                  {{ cb.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Medio</label>
              <select v-model="payForm.paymentMediumId" class="mt-1 w-full rounded border border-gray-300 px-3 py-2">
                <option value="" disabled>Seleccioná un medio</option>
                <option v-for="pm in payMediaOptions" :key="pm.id" :value="pm.id">{{ getMediumDisplayName(pm.name) }}</option>
              </select>
              <p class="mt-1 text-xs text-gray-500">Método detectado: {{ selectedPayMethodLabel }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ $t('pages.private.manager.pay.amount') }}</label>
              <input v-model.number="payForm.amount" type="number" min="0" step="0.01" class="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
            </div>
          </div>
          <div v-if="payError" class="text-xs text-red-600">{{ payError }}</div>
        </div>

        <div class="mt-4 flex justify-end gap-2">
          <UButton variant="outline" @click="closePayModal">{{ $t('common.cancel') }}</UButton>
          <UButton
            color="primary"
            :disabled="!payForm.cashBoxId || !payForm.paymentMediumId || isPaying || isCheckingCashSession || !hasOpenCashSession"
            @click="confirmPayment"
          >
            {{ $t('common.confirm') }}
          </UButton>
        </div>
      </div>
    </div>

    <AppointmentCreateModal
      v-if="selectedBranchId"
      v-model="isCreateModalOpen"
      :branch-id="selectedBranchId"
      :initial-start="createInitialStart"
      @success="refreshCalendar"
    />
  </div>
</template>
