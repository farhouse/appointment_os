<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['BARBER'],
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">Barber · Today</h1>
    <p class="text-sm text-gray-600">Placeholder page.</p>
  </div>
</template>
