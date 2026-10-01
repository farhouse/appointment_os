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
  <div class="py-8 sm:py-10">
    <div class="mx-auto max-w-7xl px-4 sm:px-6">
      <div class="mb-8 max-w-2xl">
        <h1 class="font-serif text-3xl font-semibold leading-tight text-[#17233c] sm:text-4xl">{{ $t('booking.title') }}</h1>
        <p class="mt-2 text-base text-[#627087]">{{ $t('booking.subtitle') }}</p>
      </div>

      <BookingWizard :initial-client="initialClient" />
    </div>
  </div>
</template>
