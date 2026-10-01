<template>
  <div>
    <div v-if="landingHtml" class="prose mx-auto max-w-7xl px-4 py-10 sm:px-6" v-html="landingHtml" />

    <template v-else>
      <section class="relative flex min-h-[68vh] items-end overflow-hidden bg-[#17233c] sm:min-h-[72vh]">
        <img
          src="/landing/multiservice-studio.jpg"
          :alt="$t('landing.photoAlt')"
          class="absolute inset-0 size-full object-cover object-center"
          width="1800"
          height="1013"
          fetchpriority="high"
        />
        <div class="absolute inset-0 bg-[#17233c]/55" />
        <div class="relative mx-auto w-full max-w-7xl px-4 pb-12 pt-28 sm:px-6 sm:pb-16 lg:pb-20">
          <div class="max-w-2xl text-white">
            <h1 class="font-serif text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">{{ $t('landing.brandName') }}</h1>
            <p class="mt-4 max-w-xl text-base leading-7 text-white/90 sm:text-lg">{{ $t('landing.brandSubtitle') }}</p>

            <div class="mt-7 flex flex-wrap gap-3">
              <UButton to="/book" color="primary" size="lg" icon="i-lucide-calendar-plus">{{ $t('landing.cta.book') }}</UButton>
              <UButton :to="ctaHref" color="neutral" variant="solid" size="lg">{{ ctaLabel }}</UButton>
            </div>
          </div>
        </div>
      </section>

      <section class="border-b border-[#d9e1ea] bg-white">
        <div class="mx-auto grid max-w-7xl gap-0 px-4 py-8 sm:grid-cols-3 sm:px-6 sm:py-10">
          <div class="border-b border-[#d9e1ea] py-5 sm:border-b-0 sm:border-r sm:px-6 sm:py-2 sm:first:pl-0">
            <UIcon name="i-lucide-sparkles" class="size-5 text-[#2563eb]" />
            <h2 class="mt-3 text-base font-semibold text-[#17233c]">{{ $t('landing.services.title') }}</h2>
            <p class="mt-1 text-sm leading-6 text-[#627087]">{{ $t('landing.services.description') }}</p>
          </div>
          <div class="border-b border-[#d9e1ea] py-5 sm:border-b-0 sm:border-r sm:px-6 sm:py-2">
            <UIcon name="i-lucide-clock-3" class="size-5 text-[#2d7d68]" />
            <h2 class="mt-3 text-base font-semibold text-[#17233c]">{{ $t('landing.schedule.title') }}</h2>
            <p class="mt-1 text-sm leading-6 text-[#627087]">{{ $t('landing.schedule.description') }}</p>
          </div>
          <div class="py-5 sm:px-6 sm:py-2 sm:last:pr-0">
            <UIcon name="i-lucide-user-round-check" class="size-5 text-[#b66a16]" />
            <h2 class="mt-3 text-base font-semibold text-[#17233c]">{{ $t('landing.account.title') }}</h2>
            <p class="mt-1 text-sm leading-6 text-[#627087]">{{ $t('landing.account.description') }}</p>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { loadMe, useMeState } from '~/composables/useMe'

const me = useMeState()
const { t } = useI18n()

await loadMe()

const { data: landingConfig } = await useFetch<{ html: string }>('/api/public/landing')

const landingHtml = computed(() => (landingConfig.value?.html || '').trim())
const ctaHref = computed(() => (me.value ? '/private' : '/login'))
const ctaLabel = computed(() => (me.value ? t('landing.dashboard') : t('landing.login')))
</script>
