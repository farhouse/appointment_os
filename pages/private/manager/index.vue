<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN', 'MANAGER'],
})

const shortcuts = [
  { to: '/private/manager/calendar', title: 'pages.private.manager.shortcuts.calendar', desc: 'pages.private.manager.shortcuts.calendarDesc' },
  { to: '/private/manager/cash', title: 'pages.private.manager.shortcuts.cash', desc: 'pages.private.manager.shortcuts.cashDesc' },
  { to: '/private/manager/employees', title: 'pages.private.manager.shortcuts.employees', desc: 'pages.private.manager.shortcuts.employeesDesc' },
  { to: '/private/manager/products', title: 'pages.private.manager.shortcuts.products', desc: 'pages.private.manager.shortcuts.productsDesc' },
  { to: '/private/manager/stock', title: 'pages.private.manager.shortcuts.stock', desc: 'pages.private.manager.shortcuts.stockDesc' },
  { to: '/private/manager/settings', title: 'pages.private.manager.shortcuts.settings', desc: 'pages.private.manager.shortcuts.settingsDesc' },
]
</script>

<template>
  <div>
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">{{ $t('pages.private.managerTitle') }}</h1>
        <p class="text-sm text-gray-600">{{ $t('pages.private.manager.dashboardSubtitle') }}</p>
      </div>
      <div class="flex gap-2">
        <UButton to="/private/manager/calendar" color="primary">{{ $t('pages.private.manager.cta.openCalendar') }}</UButton>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 mt-6 md:grid-cols-3">
      <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <div class="text-sm text-gray-600">{{ $t('pages.private.manager.stats.today') }}</div>
        <div class="mt-1 text-2xl font-semibold">—</div>
        <div class="mt-2 text-xs text-gray-500">{{ $t('pages.private.manager.stats.todayHint') }}</div>
      </div>
      <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <div class="text-sm text-gray-600">{{ $t('pages.private.manager.stats.pendingPayments') }}</div>
        <div class="mt-1 text-2xl font-semibold">—</div>
        <div class="mt-2 text-xs text-gray-500">{{ $t('pages.private.manager.stats.pendingPaymentsHint') }}</div>
      </div>
      <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <div class="text-sm text-gray-600">{{ $t('pages.private.manager.stats.weekRevenue') }}</div>
        <div class="mt-1 text-2xl font-semibold">—</div>
        <div class="mt-2 text-xs text-gray-500">{{ $t('pages.private.manager.stats.weekRevenueHint') }}</div>
      </div>
    </div>

    <div class="mt-8">
      <h2 class="text-lg font-semibold">{{ $t('pages.private.manager.shortcuts.title') }}</h2>
      <p class="text-sm text-gray-600">{{ $t('pages.private.manager.shortcuts.subtitle') }}</p>

      <div class="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="s in shortcuts"
          :key="s.to"
          :to="s.to"
          class="group rounded-lg border border-black/10 bg-white p-4 shadow-sm transition hover:border-black/20 hover:shadow"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="font-semibold text-gray-900 group-hover:text-gray-950">{{ $t(s.title) }}</div>
              <div class="mt-1 text-sm text-gray-600">{{ $t(s.desc) }}</div>
            </div>
            <div class="text-gray-400 group-hover:text-gray-600">→</div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
