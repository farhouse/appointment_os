<script setup lang="ts">
import type { VueCalEvent, VueCalView } from 'vue-cal'

const { locale } = useI18n()

const calendarView = ref<VueCalView | null>(null)
const calendarApi = ref<any | null>(null)
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

function handleReady({ view, vuecal }: { view: VueCalView; vuecal?: any }) {
  calendarView.value = view
  if (vuecal) calendarApi.value = vuecal
}

function handleViewChange(view: VueCalView) {
  calendarView.value = view
  if (view.id === 'day' || view.id === 'week' || view.id === 'month') {
    currentView.value = view.id
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
          <button type="button" class="px-3 py-1 rounded border border-gray-300 text-sm" @click="calendarApi?.previous()">
            {{ $t('calendar.labels.previous') }}
          </button>
          <button type="button" class="px-3 py-1 rounded border border-gray-300 text-sm" @click="calendarApi?.goToToday()">
            {{ $t('calendar.labels.today') }}
          </button>
          <button type="button" class="px-3 py-1 rounded border border-gray-300 text-sm" @click="calendarApi?.next()">
            {{ $t('calendar.labels.next') }}
          </button>
        </div>
        <div class="ml-auto text-sm font-semibold">
          {{ calendarView?.title || '' }}
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
