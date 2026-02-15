<script setup lang="ts">
import type { VueCalEvent, VueCalView } from 'vue-cal'
import { useSelectedBranch } from '~/composables/useSelectedBranch'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['BARBER'],
})

const { selectedBranchId } = useSelectedBranch()
const { locale, t } = useI18n()
const { statusLabel } = useAppointmentStatus()

const calendarView = ref<VueCalView | null>(null)
const calendarApiView = ref<VueCalView | null>(null)
const calendarPayload = ref<any | null>(null)
const calendarEvents = ref<VueCalEvent[]>([])

const currentView = ref<'day' | 'week'>('day')
const selectedEvent = ref<any | null>(null)
const editingNotes = ref('')
const savingNotes = ref(false)
const notesError = ref('')

const recentHistory = ref<any[]>([])
const historyLoading = ref(false)
const historyError = ref('')

const calendarConfig = computed(() => ({
  view: currentView.value,
  titleBar: false,
  viewsBar: false,
  todayButton: false,
  timeFrom: 8 * 60,
  timeTo: 20 * 60,
  editableEvents: false,
  events: calendarEvents.value,
  locale: locale.value === 'es-AR' ? 'es' : 'en-us'
}))

const viewOptions = [
  { id: 'day', label: 'calendar.day' },
  { id: 'week', label: 'calendar.week' }
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
  try {
    const query = new URLSearchParams({
      start: view.start.toISOString(),
      end: view.end.toISOString()
    })
    if (branchId) query.set('branchId', branchId)

    // BARBER role is enforced server-side; this returns only my appointments.
    const events = await $fetch(`/api/calendar/events?${query.toString()}`)
    calendarEvents.value = (events as VueCalEvent[]) || []
  } catch {
    calendarEvents.value = []
  }
}

const calendarKey = computed(() => `${currentView.value}-${locale.value}`)

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
  if (payload?.id === 'day' || payload?.id === 'week') currentView.value = payload.id
}

async function loadRecentHistory() {
  const clientId = selectedEvent.value?.extendedProps?.client?.id
  if (!clientId) {
    recentHistory.value = []
    return
  }

  historyLoading.value = true
  historyError.value = ''
  try {
    recentHistory.value = await $fetch(`/api/barber/clients/${clientId}/recent`)
  } catch (e: any) {
    recentHistory.value = []
    historyError.value = e?.data?.statusMessage || 'No se pudo cargar'
  } finally {
    historyLoading.value = false
  }
}

async function handleEventClick(e: any) {
  selectedEvent.value = e?.event || e
  editingNotes.value = String(selectedEvent.value?.extendedProps?.notes || '')
  notesError.value = ''
  await loadRecentHistory()
}

async function saveNotes() {
  if (!selectedEvent.value?.id) return
  savingNotes.value = true
  notesError.value = ''
  try {
    const updated = await $fetch(`/api/appointments/${selectedEvent.value.id}/notes`, {
      method: 'PATCH',
      body: { notes: editingNotes.value || null }
    })

    // Keep UI in sync.
    selectedEvent.value.extendedProps = {
      ...(selectedEvent.value.extendedProps || {}),
      notes: (updated as any)?.notes ?? editingNotes.value
    }

    // Also update the event in the calendar list.
    const idx = calendarEvents.value.findIndex((ev: any) => ev.id === selectedEvent.value.id)
    if (idx >= 0) {
      ;(calendarEvents.value[idx] as any).extendedProps = {
        ...((calendarEvents.value[idx] as any).extendedProps || {}),
        notes: selectedEvent.value.extendedProps.notes
      }
    }
  } catch (e: any) {
    notesError.value = e?.data?.statusMessage || 'No se pudo guardar'
  } finally {
    savingNotes.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">{{ $t('pages.private.barberToday') }}</h1>
        <p class="text-sm text-gray-600">{{ t('calendar.schedule') }}</p>
      </div>
    </div>

    <div class="bg-white p-4 rounded-lg shadow h-[650px] mt-4 text-gray-900">
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

    <!-- Simple modal for event details -->
    <div v-if="selectedEvent" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="selectedEvent = null">
      <div class="w-full max-w-lg rounded-lg bg-white p-4 shadow-lg">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="text-lg font-semibold truncate">{{ selectedEvent.title }}</div>
            <div class="text-sm text-gray-600 mt-1">
              <span class="font-medium">{{ t('calendar.status') }}</span>
              {{ statusLabel(selectedEvent.extendedProps?.status) }}
            </div>
          </div>
          <button class="text-sm text-gray-500 hover:text-gray-800" type="button" @click="selectedEvent = null">✕</button>
        </div>

        <div class="mt-4 space-y-3 text-sm">
          <div>
            <div class="font-medium">Cliente</div>
            <div class="text-gray-700">
              {{ selectedEvent.extendedProps?.client?.firstName }}
              {{ selectedEvent.extendedProps?.client?.lastName }}
            </div>
            <div class="text-gray-700" v-if="selectedEvent.extendedProps?.client?.phone">
              Tel: <a class="underline" :href="`tel:${selectedEvent.extendedProps.client.phone}`">{{ selectedEvent.extendedProps.client.phone }}</a>
            </div>
          </div>

          <div>
            <div class="font-medium">Historial (últimos 3)</div>
            <div v-if="historyLoading" class="text-gray-600">Cargando…</div>
            <div v-else-if="historyError" class="text-xs text-red-600">{{ historyError }}</div>
            <div v-else class="space-y-2">
              <div v-for="h in recentHistory" :key="h.id" class="rounded border border-black/10 px-3 py-2">
                <div class="flex items-center justify-between gap-3">
                  <div class="text-gray-700">
                    {{ new Date(h.startTime).toLocaleString(locale === 'es-AR' ? 'es-AR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }) }}
                  </div>
                  <div class="text-xs text-gray-500">{{ statusLabel(h.status) }}</div>
                </div>
                <div class="mt-1 text-xs text-gray-600">
                  {{ (h.services || []).join(', ') }}
                  <span v-if="h.professionalName"> · {{ h.professionalName }}</span>
                </div>
              </div>
              <div v-if="!recentHistory?.length" class="text-gray-600">Sin historial</div>
            </div>
          </div>

          <div>
            <div class="font-medium">Servicios</div>
            <div class="text-gray-700">
              {{ (selectedEvent.extendedProps?.services || []).map((s: any) => s.name).join(', ') }}
            </div>
          </div>

          <div>
            <div class="font-medium">Notas internas</div>
            <textarea
              v-model="editingNotes"
              rows="4"
              class="mt-1 w-full rounded border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Escribí notas internas para este turno…"
            />
            <div v-if="notesError" class="mt-1 text-xs text-red-600">{{ notesError }}</div>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap justify-end gap-2">
          <UButton variant="outline" @click="selectedEvent = null">Cerrar</UButton>
          <UButton color="primary" :disabled="savingNotes" @click="saveNotes">
            {{ savingNotes ? 'Guardando…' : 'Guardar notas' }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
