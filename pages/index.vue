<template>
  <div class="py-14">
    <div class="max-w-6xl mx-auto px-4">
      <!-- Section 1: brand + "see the barbershop" -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <p class="text-sm font-semibold tracking-wide uppercase text-gray-600">{{ $t('landing.brandEyebrow') }}</p>
          <h1 class="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">{{ $t('landing.brandName') }}</h1>
          <p class="mt-4 text-lg text-gray-600">{{ $t('landing.brandSubtitle') }}</p>

          <div class="mt-6 flex flex-wrap gap-3">
            <UButton to="/calendar" color="primary">{{ $t('landing.cta.book') }}</UButton>
            <UButton :to="ctaHref" variant="outline">{{ ctaLabel }}</UButton>
          </div>
        </div>

        <div class="rounded-2xl overflow-hidden border border-black/10 bg-white shadow-sm">
          <img
            src="/landing/emi-barber-1.jpg"
            :alt="$t('landing.photoAlt')"
            class="w-full h-[320px] object-cover"
            loading="lazy"
          />
        </div>
      </div>

      <!-- Section 2: quick actions (single company landing) -->
      <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="rounded-xl border border-black/10 bg-white shadow-sm p-6">
          <h2 class="text-lg font-semibold">{{ $t('landing.actions.bookTitle') }}</h2>
          <p class="mt-1 text-sm text-gray-600">{{ $t('landing.actions.bookSubtitle') }}</p>
          <div class="mt-4">
            <UButton to="/calendar" color="primary">{{ $t('landing.cta.book') }}</UButton>
          </div>
        </div>

        <div class="rounded-xl border border-black/10 bg-white shadow-sm p-6">
          <h2 class="text-lg font-semibold">{{ $t('landing.actions.loginTitle') }}</h2>
          <p class="mt-1 text-sm text-gray-600">{{ $t('landing.actions.loginSubtitle') }}</p>
          <div class="mt-4">
            <UButton :to="ctaHref" color="secondary">{{ ctaLabel }}</UButton>
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
</script>
