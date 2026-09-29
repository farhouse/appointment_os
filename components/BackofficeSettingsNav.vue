<script setup lang="ts">
type SettingsNavItem = {
  label: string
  to: string
  description?: string
}

const { t } = useI18n()

const items = computed<SettingsNavItem[]>(() => [
  {
    label: t('pages.private.managerSettingsNav.branches'),
    description: t('pages.private.managerSettingsNav.branchesDesc'),
    to: '/private/backoffice/settings/branches'
  },
  {
    label: t('pages.private.managerSettingsNav.paymentMedia'),
    description: t('pages.private.managerSettingsNav.paymentMediaDesc'),
    to: '/private/backoffice/settings/payment-media'
  },
  {
    label: t('pages.private.managerSettingsNav.email'),
    description: t('pages.private.managerSettingsNav.emailDesc'),
    to: '/private/backoffice/settings/email'
  },
  {
    label: t('pages.private.managerSettingsNav.cashboxes'),
    description: t('pages.private.managerSettingsNav.cashboxesDesc'),
    to: '/private/backoffice/settings/cashboxes'
  },
  {
    label: 'Landing',
    description: 'HTML de la home pública',
    to: '/private/backoffice/settings/landing'
  },
  {
    label: 'News/Offers',
    description: 'Promos visibles para clientes',
    to: '/private/backoffice/settings/news-offers'
  }
])

const route = useRoute()

function isActive(to: string) {
  return route.path === to
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="rounded-full border px-3 py-1 text-sm transition"
      :class="isActive(item.to)
        ? 'border-stone-300 bg-stone-900 text-white'
        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:text-stone-900'"
    >
      {{ item.label }}
    </NuxtLink>
  </div>
</template>
