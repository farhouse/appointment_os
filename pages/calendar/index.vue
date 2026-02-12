<template>
  <div class="p-4 h-screen flex flex-col">
    <div class="flex justify-between mb-4">
      <h1 class="text-2xl font-bold">{{ $t('nav.calendar') }}</h1>
      <NuxtLink to="/dashboard" class="text-blue-600">{{ $t('calendar.backToDashboard') }}</NuxtLink>
    </div>
    <div class="flex-grow">
      <ClientOnly>
        <FullCalendar :options="calendarOptions" />
      </ClientOnly>
    </div>
  </div>
</template>

<script setup>
// FullCalendar v5 requires initializing the global vdom layer before importing plugins.
import '@fullcalendar/core/vdom'

import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

const { t } = useI18n()

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  events: '/api/calendar/events',
  editable: true,
  selectable: true,
  eventDrop: handleEventDrop,
  eventClick: handleEventClick,
  select: handleDateSelect
})

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
