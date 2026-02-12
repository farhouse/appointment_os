<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['CLIENT'],
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">{{ $t('pages.private.clientAppointments') }}</h1>
    <p class="text-sm text-gray-600">{{ $t('pages.private.placeholder') }}</p>
  </div>
</template>
