<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// Load FullCalendar only on client to avoid SSR/runtime issues.
const FullCalendar = defineAsyncComponent(() => import('@fullcalendar/vue3').then((m) => m.default))

const ready = ref(false)
const plugins = shallowRef<any[]>([])

onMounted(async () => {
  const dayGrid = (await import('@fullcalendar/daygrid')).default
  const timeGrid = (await import('@fullcalendar/timegrid')).default
  const interaction = (await import('@fullcalendar/interaction')).default
  plugins.value = [dayGrid, timeGrid, interaction]
  ready.value = true
})

const calendarOptions = computed(() => ({
  plugins: plugins.value,
  initialView: 'timeGridWeek',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  slotMinTime: '08:00:00',
  slotMaxTime: '20:00:00',
  // Public calendar: gracefully handle unauth / errors.
  events: async (info: any, success: (events: any[]) => void, failure: () => void) => {
    try {
      const query = new URLSearchParams({ start: info.startStr, end: info.endStr })
      const events = await $fetch(`/api/calendar/events?${query.toString()}`)
      success(events as any[])
    } catch (e) {
      success([])
      failure()
    }
  },
  selectable: true,
  editable: false,
}))
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">{{ $t('calendar.schedule') }}</h2>
    <div class="bg-white p-4 rounded-lg shadow h-[600px] text-gray-900">
      <ClientOnly>
        <FullCalendar v-if="ready" :options="calendarOptions" class="h-full" />
      </ClientOnly>
    </div>
  </div>
</template>
