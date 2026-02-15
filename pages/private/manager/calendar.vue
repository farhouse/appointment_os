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
const currentView = ref<'day' | 'week' | 'month'>('week')

const calendarConfig = computed(() => ({
  view: currentView.value,
  titleBar: false,
  viewsBar: false,
  todayButton: false,
  timeFrom: 8 * 60,
  timeTo: 20 * 60,
  editableEvents: true,
  events: calendarEvents.value,
  locale: locale.value === 'es-AR' ? 'es' : 'en-us'
}))

const viewOptions = [
  { id: 'day', label: 'calendar.day' },
  { id: 'week', label: 'calendar.week' },
  { id: 'month', label: 'calendar.month' }
]

watch([calendarView, selectedBranchId], ([view, branchId]) => {
  if (!view) return
  void loadEvents(view, branchId)
})

watch([calendarPayload, selectedBranchId], ([payload, branchId]) => {
  if (!payload?.start || !payload?.end) return
  void loadEvents({ start: payload.start, end: payload.end } as any, branchId)
})

watch(locale, () => {
  if (calendarView.value) void loadEvents(calendarView.value, selectedBranchId.value)
})

async function loadEvents(view: VueCalView, branchId?: string | null) {
  const query = new URLSearchParams({
    start: view.start.toISOString(),
    end: view.end.toISOString()
  })
  if (branchId) query.set('branchId', branchId)
  try {
    const events = await $fetch(`/api/calendar/events?${query.toString()}`)
    calendarEvents.value = (events as VueCalEvent[]) || []
  } catch (e) {
    calendarEvents.value = []
  }
}

const calendarKey = computed(() => `${currentView.value}-${locale.value}`)

const selectedEvent = ref<any | null>(null)
const payModalOpen = ref(false)
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

function openPayModal(event: any) {
  selectedEvent.value = event
  payModalOpen.value = true
  payError.value = ''
  const totalPrice = Number(event?.extendedProps?.totalPrice ?? 0)
  payForm.amount = Number.isFinite(totalPrice) ? totalPrice : 0
  if (!cashBoxes.value.length) void loadCashBoxes()
}

function closePayModal() {
  payModalOpen.value = false
  selectedEvent.value = null
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
  openPayModal(event)
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">{{ $t('pages.private.managerCalendar') }}</h1>
    <div class="bg-white p-4 rounded-lg shadow h-[600px] mt-4 text-gray-900">
      <div class="flex flex-wrap items-center gap-2 mb-4">
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
        class="h-full"
        @ready="handleReady"
        @view-change="handleViewChange"
        @event-click="handleEventClick"
      />
    </div>

    <div v-if="payModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="closePayModal">
      <div class="w-full max-w-lg rounded-lg bg-white p-4 shadow-lg">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="text-lg font-semibold truncate">Cobrar turno</div>
            <div class="text-sm text-gray-600 mt-1">{{ selectedEvent?.title }}</div>
          </div>
          <button class="text-sm text-gray-500 hover:text-gray-800" type="button" @click="closePayModal">✕</button>
        </div>

        <div class="mt-4 space-y-4 text-sm">
          <div>
            <label class="block text-sm font-medium text-gray-700">Caja</label>
            <select v-model="payForm.cashBoxId" class="mt-1 w-full rounded border border-gray-300 px-3 py-2">
              <option value="" disabled>Selecciona una caja</option>
              <option v-for="cb in cashBoxes" :key="cb.id" :value="cb.id">
                {{ cb.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Monto</label>
            <input v-model.number="payForm.amount" type="number" min="0" step="0.01" class="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </div>
          <div v-if="payError" class="text-xs text-red-600">{{ payError }}</div>
        </div>

        <div class="mt-4 flex justify-end gap-2">
          <UButton variant="outline" @click="closePayModal">Cancelar</UButton>
          <UButton color="primary" :disabled="!payForm.cashBoxId || isPaying" @click="confirmPayment">
            Confirmar
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
