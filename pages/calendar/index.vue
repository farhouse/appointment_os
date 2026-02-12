<template>
  <div class="p-4 h-screen flex flex-col">
    <div class="flex justify-between mb-4">
      <h1 class="text-2xl font-bold">{{ $t('nav.calendar') }}</h1>
      <NuxtLink to="/dashboard" class="text-blue-600">{{ $t('calendar.backToDashboard') }}</NuxtLink>
    </div>
    <div class="flex-grow text-gray-900">
      <ClientOnly>
        <FullCalendar v-if="ready" :options="calendarOptions" />
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

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

const { t } = useI18n()

const calendarOptions = computed(() => ({
  plugins: plugins.value,
  initialView: 'timeGridWeek',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
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
  editable: true,
  selectable: true,
  eventDrop: handleEventDrop,
  eventClick: handleEventClick,
  select: handleDateSelect,
}))

async function handleEventDrop(info) {
  if (!confirm(t('calendar.confirmMove'))) {
    info.revert()
    return;
  }
  
  try {
    await $fetch(`/api/appointments/${info.event.id}/move`, {
      method: 'PATCH',
      body: {
        startTime: info.event.start.toISOString(),
        endTime: info.event.end.toISOString()
      }
    })
  } catch (e) {
    info.revert()
    alert(t('calendar.moveError'))
  }
}

function handleEventClick(info) {
  alert(t('calendar.eventAlert') + ' ' + info.event.title + '\n' + t('calendar.status') + ' ' + info.event.extendedProps.status)
}

function handleDateSelect(selectInfo) {
    // Basic stub for creating appointment from calendar
    // In real app, open a modal with form
    const title = prompt(t('calendar.newEventPrompt'))
    const calendarApi = selectInfo.view.calendar
    calendarApi.unselect() // clear date selection
    if (title) {
      // Create appointment via API would go here
      // For now just alert
      alert(t('calendar.createStub'))
    }
}
</script>
