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

type BranchSummary = {
  branchId: string
  branchName: string
  appointmentsToday: number
  revenueToday: number
  openCashSessions: number
  clientsServedToday: number
}

type DashboardSummary = {
  appointmentsToday: number
  revenueToday: number
  openCashSessions: number
  clientsServedToday: number
  totalBranches: number
  branchBreakdown?: BranchSummary[]
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

const totalBranchesLabel = computed(() => {
  if (isLoading.value) return t('common.loading')
  if (!summary.value) return '—'
  return numberFormatter.value.format(summary.value.totalBranches)
})

const branchBreakdown = computed(() => summary.value?.branchBreakdown || [])

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

    if (isManager.value) {
      if (selectedBranchId.value) query.set('branchId', selectedBranchId.value)
    } else {
      query.set('includeBranchBreakdown', 'true')
    }

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
    { to: '/private/backoffice/sales', title: 'pages.private.manager.shortcuts.sales', desc: 'pages.private.manager.shortcuts.salesDesc' },
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

    <UCard class="border border-black/10 shadow-sm">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500">Acceso rápido</div>
            <div class="text-base font-semibold">Ventas</div>
          </div>
          <span class="text-gray-400">→</span>
        </div>
      </template>
      <p class="text-sm text-gray-600">Registrar ventas, seleccionar medios de pago y ver el historial.</p>
      <template #footer>
        <UButton to="/private/backoffice/sales" color="primary" variant="soft">Ir a Ventas</UButton>
      </template>
    </UCard>

    <section v-if="isAdmin">
      <div>
        <h2 class="text-lg font-semibold">Resumen por sucursal</h2>
        <p class="text-sm text-gray-600">Vista rápida por sucursal.</p>
      </div>

      <div class="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="branch in branchBreakdown"
          :key="branch.branchId"
          class="rounded-lg border border-black/10 bg-white p-4 shadow-sm"
        >
          <div class="text-sm font-semibold text-gray-900">{{ branch.branchName }}</div>
          <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div class="text-gray-500">Turnos hoy</div>
              <div class="font-semibold">{{ numberFormatter.format(branch.appointmentsToday) }}</div>
            </div>
            <div>
              <div class="text-gray-500">Facturación hoy</div>
              <div class="font-semibold">{{ currencyFormatter.format(branch.revenueToday) }}</div>
            </div>
            <div>
              <div class="text-gray-500">Sesiones abiertas</div>
              <div class="font-semibold">{{ numberFormatter.format(branch.openCashSessions) }}</div>
            </div>
            <div>
              <div class="text-gray-500">Clientes hoy</div>
              <div class="font-semibold">{{ numberFormatter.format(branch.clientsServedToday) }}</div>
            </div>
          </div>
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
