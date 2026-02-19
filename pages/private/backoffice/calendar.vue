<script setup lang="ts">
import type { VueCalEvent, VueCalView } from 'vue-cal'
import { useSelectedBranch } from '~/composables/useSelectedBranch'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN', 'MANAGER'],
})

const { selectedBranchId } = useSelectedBranch()

const { locale } = useI18n()

const calendarView = ref<VueCalView | null>(null)
const calendarApiView = ref<VueCalView | null>(null)
const calendarPayload = ref<any | null>(null)
const calendarEvents = ref<VueCalEvent[]>([])
const isEventsLoading = ref(false)
const currentView = ref<'day' | 'week' | 'month'>('day')

const barbers = ref<{ id: string; name: string }[]>([])

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
const payModalOpen = ref(false)
const isConfirming = ref(false)
const isUpdatingStatus = ref(false)

const cashBoxes = ref<{ id: string; name: string }[]>([])
const isPaying = ref(false)
const payError = ref('')

const payForm = reactive({
  cashBoxId: '',
  amount: 0
})

async function loadCashBoxes() {
  if (!selectedBranchId.value) return
  try {
    const query = new URLSearchParams({ branchId: selectedBranchId.value })
    cashBoxes.value = await $fetch(`/api/cashboxes?${query.toString()}`)
  } catch {
    cashBoxes.value = []
  }
}

function openDetailModal(event: any) {
  selectedEvent.value = event
  detailModalOpen.value = true
}

function closeDetailModal() {
  detailModalOpen.value = false
  selectedEvent.value = null
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
  const totalPrice = Number(selectedEvent.value?.extendedProps?.totalPrice ?? 0)
  payForm.amount = Number.isFinite(totalPrice) ? totalPrice : 0
  if (!cashBoxes.value.length) void loadCashBoxes()
}

function closePayModal() {
  payModalOpen.value = false
  payError.value = ''
  payForm.amount = 0
  payForm.cashBoxId = ''
}

async function confirmPayment() {
  if (!selectedEvent.value?.id || !payForm.cashBoxId) return
  isPaying.value = true
  payError.value = ''
  try {
    await $fetch(`/api/appointments/${selectedEvent.value.id}/status`, {
      method: 'PATCH',
      body: {
        status: 'PAID',
        cashBoxId: payForm.cashBoxId,
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
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">{{ $t('pages.private.managerCalendar') }}</h1>
    <div class="bg-white p-4 rounded-lg shadow mt-4 text-gray-900 h-[calc(100vh-220px)] min-h-[600px] flex flex-col">
      <div class="flex flex-wrap items-center gap-2 mb-4">
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
          <div class="text-gray-700">
            <span class="font-medium">{{ $t('calendar.status') }}</span>
            {{ selectedEvent?.extendedProps?.status }}
          </div>
          <div v-if="selectedEvent?.extendedProps?.notes" class="text-sm">
            <div class="font-medium">Notas</div>
            <div class="text-gray-700 whitespace-pre-wrap">{{ selectedEvent.extendedProps.notes }}</div>
          </div>
          <div class="text-sm">
            <div class="font-medium">Total</div>
            <div class="text-gray-700">{{ selectedEvent?.extendedProps?.totalPrice ?? 0 }}</div>
          </div>
        </div>

        <div class="mt-4 flex justify-end gap-2 flex-wrap">
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
            No show
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
            <label class="block text-sm font-medium text-gray-700">{{ $t('pages.private.manager.pay.amount') }}</label>
            <input v-model.number="payForm.amount" type="number" min="0" step="0.01" class="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </div>
          <div v-if="payError" class="text-xs text-red-600">{{ payError }}</div>
        </div>

        <div class="mt-4 flex justify-end gap-2">
          <UButton variant="outline" @click="closePayModal">{{ $t('common.cancel') }}</UButton>
          <UButton color="primary" :disabled="!payForm.cashBoxId || isPaying" @click="confirmPayment">
            {{ $t('common.confirm') }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
