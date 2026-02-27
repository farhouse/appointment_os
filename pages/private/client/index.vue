<script setup lang="ts">
import { loadMe } from '~/composables/useMe'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['CLIENT'],
})

const { pending: isLoading } = await useAsyncData('client-dashboard-me', () => loadMe())
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">{{ $t('pages.private.clientTitle') }}</h1>
    <div v-if="isLoading" class="mt-2">
      <USkeleton class="h-4 w-64" />
    </div>
    <p v-else class="text-sm text-gray-600">{{ $t('pages.private.clientSubtitle') }}</p>
  </div>
</template>
