<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['CLIENT'],
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">Client · Book</h1>
    <p class="text-sm text-gray-600">Placeholder page.</p>
  </div>
</template>
