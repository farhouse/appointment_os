<script setup lang="ts">
import { useSelectedBranch } from '~/composables/useSelectedBranch'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['BARBER'],
})

const { selectedBranchId } = useSelectedBranch()
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">{{ $t('pages.private.barberToday') }}</h1>
    <p class="text-sm text-gray-600">{{ $t('pages.private.placeholder') }}</p>
  </div>
</template>
