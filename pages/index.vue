<template>
  <div class="text-center py-20">
    <h1 class="text-5xl font-bold mb-4">{{ $t('landing.title') }}</h1>
    <p class="text-xl text-gray-600 mb-8">{{ $t('landing.subtitle') }}</p>
    <div class="flex flex-wrap justify-center gap-4">
      <UButton to="/calendar" size="xl" color="primary">{{ $t('landing.viewCalendar') }}</UButton>
      <UButton :to="manageAppointmentsHref" size="xl" variant="outline">{{ $t('landing.manageAppointments') }}</UButton>
      <UButton
        :to="ctaHref"
        size="xl"
        color="secondary"
      >
        {{ ctaLabel }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { loadMe, useMeState } from '~/composables/useMe'

const me = useMeState()
const { t } = useI18n()

await loadMe()

const ctaHref = computed(() => (me.value ? '/private' : '/login'))
const ctaLabel = computed(() => (me.value ? t('landing.dashboard') : t('landing.login')))
const manageAppointmentsHref = computed(() => (me.value ? '/private' : '/login'))
</script>
