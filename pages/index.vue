<template>
  <div class="py-14">
    <div class="max-w-6xl mx-auto px-4">
      <div class="mb-10">
        <h1 class="text-4xl md:text-5xl font-semibold tracking-tight">{{ $t('landing.title') }}</h1>
        <p class="mt-3 text-lg text-gray-600">{{ $t('landing.subtitle') }}</p>
      </div>

      <!-- 3 vertical columns (cards). Each card has room for a photo + CTA on the side. -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="rounded-xl border border-black/10 bg-white shadow-sm p-6">
          <div class="flex gap-4 items-start">
            <div class="w-28 h-28 rounded-lg bg-gray-100 border border-black/10 flex items-center justify-center text-xs text-gray-600">
              {{ $t('landing.photoPlaceholder') }}
            </div>
            <div class="min-w-0">
              <h2 class="text-lg font-semibold">{{ $t('landing.cards.calendar.title') }}</h2>
              <p class="mt-1 text-sm text-gray-600">{{ $t('landing.cards.calendar.subtitle') }}</p>
              <div class="mt-4">
                <UButton to="/calendar" color="primary">{{ $t('landing.viewCalendar') }}</UButton>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-black/10 bg-white shadow-sm p-6">
          <div class="flex gap-4 items-start">
            <div class="w-28 h-28 rounded-lg bg-gray-100 border border-black/10 flex items-center justify-center text-xs text-gray-600">
              {{ $t('landing.photoPlaceholder') }}
            </div>
            <div class="min-w-0">
              <h2 class="text-lg font-semibold">{{ $t('landing.cards.manage.title') }}</h2>
              <p class="mt-1 text-sm text-gray-600">{{ $t('landing.cards.manage.subtitle') }}</p>
              <div class="mt-4">
                <UButton :to="manageAppointmentsHref" variant="outline">{{ $t('landing.manageAppointments') }}</UButton>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-black/10 bg-white shadow-sm p-6">
          <div class="flex gap-4 items-start">
            <div class="w-28 h-28 rounded-lg bg-gray-100 border border-black/10 flex items-center justify-center text-xs text-gray-600">
              {{ $t('landing.photoPlaceholder') }}
            </div>
            <div class="min-w-0">
              <h2 class="text-lg font-semibold">{{ $t('landing.cards.account.title') }}</h2>
              <p class="mt-1 text-sm text-gray-600">{{ $t('landing.cards.account.subtitle') }}</p>
              <div class="mt-4">
                <UButton :to="ctaHref" color="secondary">{{ ctaLabel }}</UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
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
