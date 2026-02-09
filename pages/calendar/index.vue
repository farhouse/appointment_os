<template>
  <div class="p-4 h-screen flex flex-col">
    <div class="flex justify-between mb-4">
      <h1 class="text-2xl font-bold">Calendar</h1>
      <NuxtLink to="/dashboard" class="text-blue-600">Back to Dashboard</NuxtLink>
    </div>
    <div class="flex-grow">
      <FullCalendar :options="calendarOptions" />
    </div>
  </div>
</template>

<script setup>
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

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
  if (!confirm("Are you sure about this change?")) {
    info.revert();
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
    alert('Failed to move appointment')
  }
}

function handleEventClick(info) {
  alert('Event: ' + info.event.title + '\nStatus: ' + info.event.extendedProps.status);
}

function handleDateSelect(selectInfo) {
    // Basic stub for creating appointment from calendar
    // In real app, open a modal with form
    const title = prompt('Please enter a new title for your event');
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect(); // clear date selection
    if (title) {
      // Create appointment via API would go here
      // For now just alert
      alert('Create appointment functionality to be implemented with modal form')
    }
}
</script>
