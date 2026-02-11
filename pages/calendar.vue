<script setup lang="ts">
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
  slotMinTime: '08:00:00',
  slotMaxTime: '20:00:00',
  events: '/api/calendar/events',
  selectable: true,
  editable: true,
  select: (info: any) => {
    // Handle date selection for new appointment
    console.log('Selected:', info)
  }
})
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-4">Schedule</h2>
    <div class="bg-white p-4 rounded-lg shadow h-[600px]">
      <FullCalendar :options="calendarOptions" class="h-full" />
    </div>
  </div>
</template>
