<script setup lang="ts">
import { loadMe, useMeState } from '~/composables/useMe'

definePageMeta({
  layout: 'private',
  middleware: ['private'],
})

await loadMe()
const me = useMeState()
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">{{ $t('pages.private.profileTitle') }}</h1>
    <p class="text-sm text-gray-600">{{ $t('pages.private.profileSubtitle') }}</p>

    <div class="mt-6 rounded-lg border border-black/10 bg-white p-4 shadow-sm text-gray-900">
      <div class="text-sm text-gray-500">{{ $t('pages.private.profile.email') }}</div>
      <div class="font-medium">{{ me?.email }}</div>

      <div class="mt-4 text-sm text-gray-500">{{ $t('pages.private.profile.name') }}</div>
      <div class="font-medium">{{ me?.name }}</div>

      <div class="mt-4 text-sm text-gray-500">{{ $t('pages.private.profile.role') }}</div>
      <div class="font-medium">{{ me?.role }}</div>
    </div>
  </div>
</template>
