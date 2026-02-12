<script setup lang="ts">
import { useSelectedBranch } from '~/composables/useSelectedBranch'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN', 'MANAGER'],
})

const { selectedBranchId } = useSelectedBranch()

const calendarOptions = computed(() => {
  const branchId = selectedBranchId.value
  return {
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    slotMinTime: '08:00:00',
    slotMaxTime: '20:00:00',
    events: (info: { startStr: string; endStr: string }, success: (events: any[]) => void, failure: () => void) => {
      const query = new URLSearchParams({ start: info.startStr, end: info.endStr })
      if (branchId) query.set('branchId', branchId)
      $fetch(`/api/calendar/events?${query.toString()}`)
        .then((events) => success(events as any[]))
        .catch(() => failure())
    },
    selectable: true,
    editable: true
  }
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">{{ $t('pages.private.managerCalendar') }}</h1>
    <div class="bg-white p-4 rounded-lg shadow h-[600px] mt-4 text-gray-900">
      <FullCalendarClient :options="calendarOptions" class="h-full" />
    </div>
  </div>
</template>
