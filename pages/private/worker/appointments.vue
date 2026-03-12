<script setup lang="ts">
import { useSelectedBranch } from '~/composables/useSelectedBranch'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['BARBER'],
})

type Appointment = {
  id: string
  status: string
  startTime: string
  endTime: string
  branch: { id: string; name: string }
  client: { firstName: string; lastName?: string | null; phone?: string | null }
  services: { service: { name: string } }[]
}

const { t } = useI18n()
const { statusLabel, statusColor, formatDateTime } = useAppointmentStatus()

const { selectedBranchId } = useSelectedBranch()

const appointments = ref<Appointment[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const range = ref<'week' | 'month'>('week')
const status = ref<string>('')

const statusOptions = computed(() => [
  { label: t('appointments.status.pending'), value: 'PENDING' },
  { label: t('appointments.status.confirmed'), value: 'CONFIRMED' },
  { label: t('appointments.status.in_progress'), value: 'IN_PROGRESS' },
  { label: t('appointments.status.finished'), value: 'FINISHED' },
  { label: t('appointments.status.paid'), value: 'PAID' },
  { label: t('appointments.status.canceled'), value: 'CANCELED' },
  { label: t('appointments.status.no_show'), value: 'NO_SHOW' }
])

const filteredAppointments = computed(() => {
  if (!selectedBranchId.value) return appointments.value
  return appointments.value.filter(apt => apt.branch?.id === selectedBranchId.value)
})

const isEmpty = computed(() => !isLoading.value && !errorMessage.value && filteredAppointments.value.length === 0)

async function loadAppointments() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const query = new URLSearchParams({ range: range.value })
    if (status.value) query.set('status', status.value)
    appointments.value = await $fetch(`/api/worker/appointments?${query.toString()}`)
  } catch (e: any) {
    appointments.value = []
    errorMessage.value = e?.data?.statusMessage || t('admin.common.loadError')
  } finally {
    isLoading.value = false
  }
}

watch([range, status], () => {
  void loadAppointments()
})

onMounted(() => {
  void loadAppointments()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">{{ $t('pages.private.barberAppointments') }}</h1>
        <p class="text-sm text-gray-600">{{ $t('pages.private.barberSubtitle') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 text-sm">
          <span class="text-stone-500">{{ $t('appointments.filters.range') }}</span>
          <USelect v-model="range" :items="[
            { label: $t('appointments.filters.week'), value: 'week' },
            { label: $t('appointments.filters.month'), value: 'month' }
          ]" value-key="value" />
        </div>
        <div class="flex items-center gap-2 text-sm">
          <span class="text-stone-500">{{ $t('appointments.filters.status') }}</span>
          <USelect v-model="status" :items="statusOptions" value-key="value" clearable />
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-stone-200 bg-white shadow-sm">
      <div v-if="isLoading" class="p-6">
        <USkeleton class="h-10 w-full" />
        <USkeleton class="mt-3 h-10 w-full" />
      </div>

      <div v-else-if="errorMessage" class="p-6">
        <CrudState
          :title="$t('admin.common.errorTitle')"
          :description="errorMessage"
          icon="i-lucide-alert-triangle"
          :action-label="$t('admin.common.retry')"
          @action="loadAppointments"
        />
      </div>

      <div v-else-if="isEmpty" class="p-6">
        <CrudState
          :title="$t('appointments.empty.upcomingTitle')"
          :description="$t('appointments.empty.upcomingDescription')"
          icon="i-lucide-calendar"
        />
      </div>

      <div v-else class="divide-y divide-stone-200">
        <div v-for="apt in filteredAppointments" :key="apt.id" class="p-4 sm:p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div class="text-sm text-stone-500">{{ $t('appointments.labels.time') }}</div>
              <div class="text-base font-semibold text-stone-900">{{ formatDateTime(apt.startTime) }}</div>
            </div>
            <UBadge :color="statusColor(apt.status)" variant="subtle">
              {{ statusLabel(apt.status) }}
            </UBadge>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <div class="text-xs uppercase tracking-wide text-stone-500">Cliente</div>
              <div class="text-sm text-stone-800">
                {{ apt.client.firstName }} {{ apt.client.lastName || '' }}
              </div>
              <div v-if="apt.client.phone" class="text-xs text-stone-500">{{ apt.client.phone }}</div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-wide text-stone-500">{{ $t('appointments.labels.branch') }}</div>
              <div class="text-sm text-stone-800">{{ apt.branch?.name || '—' }}</div>
            </div>
            <div class="sm:col-span-2">
              <div class="text-xs uppercase tracking-wide text-stone-500">{{ $t('appointments.labels.services') }}</div>
              <div class="text-sm text-stone-800">
                {{ apt.services.map(s => s.service.name).join(', ') || '—' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
