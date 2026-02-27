<script setup lang="ts">
import { loadMe, useMeState } from '~/composables/useMe'
import { useSelectedBranch } from '~/composables/useSelectedBranch'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN', 'MANAGER'],
})

await loadMe()
const me = useMeState()

const { t, locale } = useI18n()
const { selectedBranchId } = useSelectedBranch()

const isAdmin = computed(() => me.value?.role === 'OWNER' || me.value?.role === 'ADMIN')
const isManager = computed(() => me.value?.role === 'MANAGER')

type DashboardSummary = {
  appointmentsToday: number
  revenueToday: number
  openCashSessions: number
  clientsServedToday: number
}

const summary = ref<DashboardSummary | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

const numberFormatter = computed(() => new Intl.NumberFormat(locale.value || 'es-AR'))
const currencyFormatter = computed(() => new Intl.NumberFormat(locale.value || 'es-AR', { style: 'currency', currency: 'ARS' }))

const appointmentsTodayLabel = computed(() => {
  if (isLoading.value) return t('common.loading')
  if (!summary.value) return '—'
  return numberFormatter.value.format(summary.value.appointmentsToday)
})

const revenueTodayLabel = computed(() => {
  if (isLoading.value) return t('common.loading')
  if (!summary.value) return '—'
  return currencyFormatter.value.format(summary.value.revenueToday)
})

const openCashSessionsLabel = computed(() => {
  if (isLoading.value) return t('common.loading')
  if (!summary.value) return '—'
  return numberFormatter.value.format(summary.value.openCashSessions)
})

const clientsServedTodayLabel = computed(() => {
  if (isLoading.value) return t('common.loading')
  if (!summary.value) return '—'
  return numberFormatter.value.format(summary.value.clientsServedToday)
})

async function loadSummary() {
  errorMessage.value = ''

  if (isManager.value && !selectedBranchId.value) {
    summary.value = null
    errorMessage.value = t('pages.private.manager.stats.branchRequired')
    return
  }

  isLoading.value = true
  try {
    const query = new URLSearchParams()
    if (selectedBranchId.value) query.set('branchId', selectedBranchId.value)
    const suffix = query.toString() ? `?${query.toString()}` : ''
    summary.value = await $fetch<DashboardSummary>(`/api/dashboard/summary${suffix}`)
  } catch (e: any) {
    summary.value = null
    errorMessage.value = e?.data?.statusMessage || t('admin.common.loadError')
  } finally {
    isLoading.value = false
  }
}

watch(selectedBranchId, () => {
  void loadSummary()
}, { immediate: true })

const shortcuts = computed(() => {
  const base = [
    { to: '/private/backoffice/calendar', title: 'pages.private.manager.shortcuts.calendar', desc: 'pages.private.manager.shortcuts.calendarDesc' },
    { to: '/private/backoffice/cash', title: 'pages.private.manager.shortcuts.cash', desc: 'pages.private.manager.shortcuts.cashDesc' },
    { to: '/private/backoffice/products?tab=stock', title: 'pages.private.manager.shortcuts.stock', desc: 'pages.private.manager.shortcuts.stockDesc' },
  ]

  if (!isAdmin.value) return base

  return [
    ...base,
    { to: '/private/backoffice/employees', title: 'pages.private.manager.shortcuts.employees', desc: 'pages.private.manager.shortcuts.employeesDesc' },
    { to: '/private/backoffice/products', title: 'pages.private.manager.shortcuts.products', desc: 'pages.private.manager.shortcuts.productsDesc' },
    { to: '/private/backoffice/settings', title: 'pages.private.manager.shortcuts.settings', desc: 'pages.private.manager.shortcuts.settingsDesc' },
  ]
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">{{ $t('pages.private.managerTitle') }}</h1>
        <p class="text-sm text-gray-600">{{ $t('pages.private.manager.dashboardSubtitle') }}</p>
      </div>
      <div class="flex gap-2">
        <UButton to="/private/backoffice/calendar" color="primary">{{ $t('pages.private.manager.cta.openCalendar') }}</UButton>
      </div>
    </div>

    <section>
      <div>
        <h2 class="text-lg font-semibold">{{ $t('pages.private.manager.sections.overview.title') }}</h2>
        <p class="text-sm text-gray-600">{{ $t('pages.private.manager.sections.overview.subtitle') }}</p>
        <p v-if="errorMessage" class="mt-2 text-sm text-rose-600">{{ errorMessage }}</p>
      </div>
      <div class="grid grid-cols-1 gap-4 mt-4 md:grid-cols-4">
        <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div class="text-sm text-gray-600">{{ $t('pages.private.manager.stats.appointmentsToday') }}</div>
          <div class="mt-1 text-2xl font-semibold">{{ appointmentsTodayLabel }}</div>
          <div class="mt-2 text-xs text-gray-500">{{ $t('pages.private.manager.stats.appointmentsTodayHint') }}</div>
        </div>
        <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div class="text-sm text-gray-600">{{ $t('pages.private.manager.stats.revenueToday') }}</div>
          <div class="mt-1 text-2xl font-semibold">{{ revenueTodayLabel }}</div>
          <div class="mt-2 text-xs text-gray-500">{{ $t('pages.private.manager.stats.revenueTodayHint') }}</div>
        </div>
        <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div class="text-sm text-gray-600">{{ $t('pages.private.manager.stats.openCashSessions') }}</div>
          <div class="mt-1 text-2xl font-semibold">{{ openCashSessionsLabel }}</div>
          <div class="mt-2 text-xs text-gray-500">{{ $t('pages.private.manager.stats.openCashSessionsHint') }}</div>
        </div>
        <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div class="text-sm text-gray-600">{{ $t('pages.private.manager.stats.clientsServedToday') }}</div>
          <div class="mt-1 text-2xl font-semibold">{{ clientsServedTodayLabel }}</div>
          <div class="mt-2 text-xs text-gray-500">{{ $t('pages.private.manager.stats.clientsServedTodayHint') }}</div>
        </div>
      </div>
    </section>

    <section>
      <div>
        <h2 class="text-lg font-semibold">{{ $t('pages.private.manager.sections.modules.title') }}</h2>
        <p class="text-sm text-gray-600">{{ $t('pages.private.manager.sections.modules.subtitle') }}</p>
      </div>

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
              <div class="mt-3 text-xs font-medium text-gray-500 group-hover:text-gray-700">{{ $t('pages.private.manager.card.open') }}</div>
            </div>
            <div class="text-gray-400 group-hover:text-gray-600">→</div>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
