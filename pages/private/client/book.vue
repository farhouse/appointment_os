<script setup lang="ts">
import { useSelectedBranch } from '~/composables/useSelectedBranch'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['CLIENT'],
})

const { selectedBranchId } = useSelectedBranch()
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">{{ $t('pages.private.clientBook') }}</h1>
    <p v-if="!selectedBranchId" class="text-sm text-gray-600">
      {{ $t('booking.selectBranch') }}
    </p>
    <p v-else class="text-sm text-gray-600">{{ $t('pages.private.placeholder') }}</p>
  </div>
</template>
