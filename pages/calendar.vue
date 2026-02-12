<script setup lang="ts">
const calendarOptions = computed(() => ({
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
      <FullCalendarClient :options="calendarOptions" class="h-full" />
    </div>
  </div>
</template>
