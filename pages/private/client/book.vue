<script setup lang="ts">
import { useSelectedBranch } from '~/composables/useSelectedBranch'
import { loadMe } from '~/composables/useMe'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['CLIENT'],
})

const { selectedBranchId } = useSelectedBranch()
const route = useRoute()

const { data: me, pending: isLoading } = await useAsyncData('client-book-me', () => loadMe())
const initialClient = computed(() => {
  if (!me.value) return {}
  const parts = (me.value.name || '').split(' ')
  const firstName = parts.shift() || me.value.name
  const lastName = parts.join(' ') || ''
  return {
    firstName,
    lastName,
    email: me.value.email,
    phone: (me.value as any).phone || undefined,
  }
})
</script>

<template>
  <div class="space-y-4">
    <div>
    <h1 class="text-2xl font-semibold">{{ $t('pages.private.clientBook') }}</h1>
    <div v-if="isLoading" class="mt-2">
      <USkeleton class="h-4 w-64" />
    </div>
    <p v-else class="text-sm text-gray-600">{{ $t('booking.subtitle') }}</p>
  </div>

    <p v-if="!selectedBranchId" class="text-sm text-gray-600">
      {{ $t('booking.selectBranch') }}
    </p>

    <div v-if="isLoading" class="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
      <div class="space-y-3">
        <USkeleton class="h-5 w-40" />
        <USkeleton class="h-8 w-full" />
        <USkeleton class="h-8 w-5/6" />
        <USkeleton class="h-8 w-4/6" />
      </div>
    </div>
    <BookingWizard
      v-else
      :initial-branch-id="(route.query.branchId as string) || selectedBranchId || undefined"
      :initial-service-id="route.query.serviceId as string || undefined"
      :initial-worker-id="route.query.workerId as string || undefined"
      :initial-client="initialClient"
      :hide-details-title="true"
    />
  </div>
</template>
