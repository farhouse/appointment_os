<script setup lang="ts">
import type { VueCalEvent, VueCalView } from 'vue-cal'

const { locale } = useI18n()

const calendarView = ref<VueCalView | null>(null)
// vue-cal v5 emits a *view instance* on `ready`, but emits a *plain payload* on `view-change`.
// Keep the instance here for navigation methods (previous/next/today).
const calendarApiView = ref<VueCalView | null>(null)
// Keep latest payload for title/start/end display & event fetching.
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
  editableEvents: false,
  events: calendarEvents.value,
  locale: locale.value === 'es-AR' ? 'es' : 'en-us'
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

watch(calendarPayload, (payload) => {
  if (!payload?.start || !payload?.end) return
  // payload.start/end are Dates.
  void loadEvents({ start: payload.start, end: payload.end } as any)
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
  // vue-cal emits a payload object on view-change (not the view instance).
  calendarPayload.value = payload
  if (payload?.id === 'day' || payload?.id === 'week' || payload?.id === 'month') {
    currentView.value = payload.id
  }
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">{{ $t('calendar.schedule') }}</h2>
    <div class="bg-white p-4 rounded-lg shadow h-[600px] text-gray-900">
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
      />
    </div>
  </div>
</template>
