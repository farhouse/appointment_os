<script setup lang="ts">
</script>

<template>
  <div class="py-10">
    <div class="max-w-6xl mx-auto px-4">
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-semibold">{{ $t('booking.title') }}</h1>
        <p class="mt-2 text-gray-600">{{ $t('booking.subtitle') }}</p>
      </div>

      <BookingWizard />
    </div>
  </div>
</template>
