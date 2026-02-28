<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN']
})

const { t } = useI18n()

const cards = computed(() => [
  {
    title: t('pages.private.managerSettingsNav.branches'),
    description: t('pages.private.managerSettingsNav.branchesDesc'),
    to: '/private/backoffice/settings/branches'
  },
  {
    title: t('pages.private.managerSettingsNav.paymentMedia'),
    description: t('pages.private.managerSettingsNav.paymentMediaDesc'),
    to: '/private/backoffice/settings/payment-media'
  },
  {
    title: t('pages.private.managerSettingsNav.email'),
    description: t('pages.private.managerSettingsNav.emailDesc'),
    to: '/private/backoffice/settings/email'
  },
  {
    title: t('pages.private.managerSettingsNav.cashboxes'),
    description: t('pages.private.managerSettingsNav.cashboxesDesc'),
    to: '/private/backoffice/settings/cashboxes'
  }
])
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">{{ $t('pages.private.managerSettings') }}</h1>
      <p class="text-sm text-gray-600">{{ $t('pages.private.managerSettingsHub.subtitle') }}</p>
    </div>

    <BackofficeSettingsNav />

    <div class="grid gap-4 md:grid-cols-2">
      <NuxtLink
        v-for="card in cards"
        :key="card.to"
        :to="card.to"
        class="group rounded-lg border border-black/10 bg-white p-4 shadow-sm transition hover:border-black/20 hover:shadow"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="font-semibold text-gray-900 group-hover:text-gray-950">{{ card.title }}</div>
            <div class="mt-1 text-sm text-gray-600">{{ card.description }}</div>
            <div class="mt-3 text-xs font-medium text-gray-500 group-hover:text-gray-700">{{ $t('pages.private.managerSettingsHub.open') }}</div>
          </div>
          <div class="text-gray-400 group-hover:text-gray-600">→</div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
