<template>
  <div class="p-4 h-screen flex flex-col">
    <div class="flex justify-between mb-4">
      <h1 class="text-2xl font-bold">{{ $t('nav.calendar') }}</h1>
      <NuxtLink to="/dashboard" class="text-blue-600">{{ $t('calendar.backToDashboard') }}</NuxtLink>
    </div>
    <div class="flex-grow text-gray-900">
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
          <button type="button" class="px-3 py-1 rounded border border-gray-300 text-sm" @click="calendarView?.previous()">
            {{ $t('calendar.labels.previous') }}
          </button>
          <button type="button" class="px-3 py-1 rounded border border-gray-300 text-sm" @click="calendarView?.goToToday()">
            {{ $t('calendar.labels.today') }}
          </button>
          <button type="button" class="px-3 py-1 rounded border border-gray-300 text-sm" @click="calendarView?.next()">
            {{ $t('calendar.labels.next') }}
          </button>
        </div>
        <div class="ml-auto text-sm font-semibold">
          {{ calendarView?.title || '' }}
        </div>
      </div>
      <VueCalClient
        :key="calendarKey"
        class="h-full"
        :config="calendarConfig"
        @ready="handleReady"
        @view-change="handleViewChange"
        @event-dropped="handleEventDropped"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VueCalEvent, VueCalView } from 'vue-cal'

const { t, locale } = useI18n()

const calendarView = ref<VueCalView | null>(null)
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
  locale: locale.value === 'es-AR' ? 'es' : 'en-us',
  eventListeners: {
    event: {
      click: ({ event }: { event: VueCalEvent }) => {
        handleEventClick({ event })
      }
    },
    cell: {
      click: ({ cell }: { cell: { start: Date } }) => {
        handleDateSelect({ cell })
      }
    }
  }
}))

const viewOptions = [
  { id: 'day', label: 'calendar.day' },
  { id: 'week', label: 'calendar.week' },
  { id: 'month', label: 'calendar.month' }
]

watch(calendarView, (view) => {
  if (!view) return
  void loadEvents(view)
})

watch(locale, () => {
  if (calendarView.value) void loadEvents(calendarView.value)
})

async function loadEvents(view: VueCalView) {
  try {
    const query = new URLSearchParams({
      start: view.start.toISOString(),
      end: view.end.toISOString()
    })
    const events = await $fetch(`/api/calendar/events?${query.toString()}`)
    calendarEvents.value = (events as VueCalEvent[]) || []
  } catch (e) {
    calendarEvents.value = []
  }
}

function getEventPayload(event: VueCalEvent) {
  if (!event.start || !event.end) return null
  return {
    startTime: new Date(event.start).toISOString(),
    endTime: new Date(event.end).toISOString()
  }
}

async function handleEventDropped({ event }: { event: VueCalEvent }) {
  if (!confirm(t('calendar.confirmMove'))) return

  const payload = getEventPayload(event)
  if (!payload || !event.id) return

  try {
    await $fetch(`/api/appointments/${event.id}/move`, {
      method: 'PATCH',
      body: payload
    })
  } catch (e) {
    alert(t('calendar.moveError'))
    if (calendarView.value) void loadEvents(calendarView.value)
  }
}

function handleEventClick({ event }: { event: VueCalEvent }) {
  alert(`${t('calendar.eventAlert')} ${event.title || ''}\n${t('calendar.status')} ${(event as any).extendedProps?.status ?? ''}`)
}

function handleDateSelect({ cell }: { cell: { start: Date } }) {
  const title = prompt(t('calendar.newEventPrompt'))
  if (title) {
    alert(t('calendar.createStub'))
  }
}

const calendarKey = computed(() => `${currentView.value}-${locale.value}`)

function handleReady({ view }: { view: VueCalView }) {
  calendarView.value = view
}

function handleViewChange(view: VueCalView) {
  calendarView.value = view
  if (view.id === 'day' || view.id === 'week' || view.id === 'month') {
    currentView.value = view.id
  }
}
</script>
