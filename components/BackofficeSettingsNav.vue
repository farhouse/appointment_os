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
  <nav aria-label="Secciones de configuración" class="flex gap-1 overflow-x-auto border-b border-[#d9e1ea]">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="min-h-11 shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition"
      :class="isActive(item.to)
        ? 'border-[#2563eb] text-[#1d4ed8]'
        : 'border-transparent text-[#627087] hover:border-[#c2ccd9] hover:text-[#17233c]'"
    >
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>
