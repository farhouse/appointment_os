<script setup lang="ts">
import { loadMe } from '~/composables/useMe'

const initialClient = ref<{ firstName?: string; lastName?: string; email?: string; phone?: string }>({})

onMounted(async () => {
  const me = await loadMe()
  if (!me || me.role !== 'CLIENT') return

  const name = (me.name || '').trim()
  const parts = name.split(/\s+/).filter(Boolean)
  const firstName = parts[0]
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined

  initialClient.value = {
    firstName,
    lastName,
    email: me.email,
    phone: me.phone || undefined,
  }
})
</script>

<template>
  <div class="py-10">
    <div class="max-w-6xl mx-auto px-4">
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-semibold">{{ $t('booking.title') }}</h1>
        <p class="mt-2 text-gray-600">{{ $t('booking.subtitle') }}</p>
      </div>

      <BookingWizard :initial-client="initialClient" />
    </div>
  </div>
</template>
