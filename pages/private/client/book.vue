<script setup lang="ts">
import { useSelectedBranch } from '~/composables/useSelectedBranch'
import { loadMe } from '~/composables/useMe'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['CLIENT'],
})

const { selectedBranchId } = useSelectedBranch()

const me = await loadMe()
const initialClient = computed(() => {
  if (!me) return {}
  const parts = (me.name || '').split(' ')
  const firstName = parts.shift() || me.name
  const lastName = parts.join(' ') || ''
  return {
    firstName,
    lastName,
    email: me.email,
    phone: (me as any).phone || undefined,
  }
})
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-2xl font-semibold">{{ $t('pages.private.clientBook') }}</h1>
      <p class="text-sm text-gray-600">{{ $t('booking.subtitle') }}</p>
    </div>

    <p v-if="!selectedBranchId" class="text-sm text-gray-600">
      {{ $t('booking.selectBranch') }}
    </p>

    <BookingWizard
      v-else
      :initial-branch-id="selectedBranchId"
      :initial-client="initialClient"
      :hide-details-title="true"
    />
  </div>
</template>
