<script setup lang="ts">
import { useSelectedBranch } from '~/composables/useSelectedBranch'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['BARBER'],
})

const { selectedBranchId } = useSelectedBranch()
const { locale } = useI18n()

function formatCurrency(value: number) {
  return new Intl.NumberFormat(locale.value === 'es-AR' ? 'es-AR' : 'en-US', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

const weeks = ref(8)
const loading = ref(false)
const error = ref('')

type FinanceWeek = {
  weekStart: string
  countPaidAppointments: number
  serviceAmount: number
  estimatedCommission: number
}

const data = ref<{
  totals: {
    countPaidAppointments: number
    commissionRate: number
    serviceAmount: number
    estimatedCommission: number
  }
  weeks: FinanceWeek[]
} | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const query = new URLSearchParams({ weeks: String(weeks.value) })
    if (selectedBranchId.value) query.set('branchId', selectedBranchId.value)
    data.value = await $fetch(`/api/worker/finances?${query.toString()}`)
  } catch (e: any) {
    data.value = null
    error.value = e?.data?.statusMessage || 'No se pudo cargar'
  } finally {
    loading.value = false
  }
}

watch([selectedBranchId, weeks], () => void load(), { immediate: true })
</script>

<template>
  <div>
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">{{ $t('pages.private.barberFinances') }}</h1>
        <p class="text-sm text-gray-600">{{ $t('pages.private.barberFinancesHint') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-700">{{ $t('pages.private.weeks') }}</label>
        <select v-model.number="weeks" class="border rounded px-2 py-1 text-sm">
          <option :value="4">4</option>
          <option :value="8">8</option>
          <option :value="12">12</option>
          <option :value="26">26</option>
        </select>
      </div>
    </div>

    <div class="mt-4 bg-white rounded-lg shadow p-4 text-gray-900">
      <div v-if="loading" class="text-sm text-gray-600">Cargando…</div>
      <div v-else-if="error" class="text-sm text-red-600">{{ error }}</div>
      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="rounded border border-black/10 p-3">
            <div class="text-xs text-gray-500">{{ $t('pages.private.totalPaidAppointments') }}</div>
            <div class="text-2xl font-semibold">{{ data?.totals.countPaidAppointments || 0 }}</div>
          </div>
          <div class="rounded border border-black/10 p-3">
            <div class="text-xs text-gray-500">Total servicios</div>
            <div class="text-2xl font-semibold">{{ formatCurrency(data?.totals.serviceAmount || 0) }}</div>
          </div>
          <div class="rounded border border-black/10 p-3">
            <div class="text-xs text-gray-500">Comisión estimada ({{ data?.totals.commissionRate || 0 }}%)</div>
            <div class="text-2xl font-semibold">{{ formatCurrency(data?.totals.estimatedCommission || 0) }}</div>
          </div>
        </div>

        <div class="mt-4">
          <div class="text-sm font-semibold mb-2">{{ $t('pages.private.weekByWeek') }}</div>
          <div class="space-y-2">
            <div v-for="w in data?.weeks || []" :key="w.weekStart" class="grid grid-cols-1 md:grid-cols-4 gap-2 border rounded px-3 py-2">
              <div class="text-sm text-gray-700">{{ w.weekStart }}</div>
              <div class="text-sm font-semibold">{{ w.countPaidAppointments }} turnos</div>
              <div class="text-sm">{{ formatCurrency(w.serviceAmount) }}</div>
              <div class="text-sm font-semibold text-emerald-700">{{ formatCurrency(w.estimatedCommission) }}</div>
            </div>
          </div>
          <p class="mt-3 text-xs text-gray-500">
            {{ $t('pages.private.paidDefinitionNote') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
