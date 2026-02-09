<script setup lang="ts">
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Service' },
  { key: 'start', label: 'Start Time' },
  { key: 'end', label: 'End Time' },
  { key: 'userName', label: 'Customer' },
  { key: 'status', label: 'Status' }
]

const { data: bookings } = await useFetch('/api/bookings')

// Helper to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Bookings</h2>
      <UButton icon="i-heroicons-plus">New Booking</UButton>
    </div>

    <UTable :rows="bookings || []" :columns="columns">
      <template #start-data="{ row }">
        {{ formatDate(row.start) }}
      </template>
      <template #end-data="{ row }">
        {{ formatDate(row.end) }}
      </template>
    </UTable>
  </div>
</template>
