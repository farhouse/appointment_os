<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['CLIENT'],
})

type Appointment = {
  id: string
  status: string
  startTime: string
  endTime: string
  branch: { name: string }
  professional?: { name: string } | null
  services: { service: { name: string } }[]
}

const { t } = useI18n()
const { statusLabel, statusColor, formatDateTime } = useAppointmentStatus()

const appointments = ref<Appointment[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const tabs = computed(() => [
  { value: 'upcoming', label: t('appointments.sections.upcoming') },
  { value: 'past', label: t('appointments.sections.past') }
])

const activeTab = ref<'upcoming' | 'past'>('upcoming')

const now = computed(() => new Date())

const upcoming = computed(() => appointments.value.filter(apt => new Date(apt.startTime) >= now.value))
const past = computed(() => appointments.value.filter(apt => new Date(apt.startTime) < now.value))

const currentList = computed(() => activeTab.value === 'upcoming' ? upcoming.value : past.value)
const isEmpty = computed(() => !isLoading.value && !errorMessage.value && currentList.value.length === 0)

async function loadAppointments() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    appointments.value = await $fetch('/api/client/appointments')
  } catch (e: any) {
    appointments.value = []
    errorMessage.value = e?.data?.statusMessage || t('admin.common.loadError')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadAppointments()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">{{ $t('pages.private.clientAppointments') }}</h1>
      <p class="text-sm text-gray-600">{{ $t('pages.private.clientSubtitle') }}</p>
    </div>

    <UTabs v-model="activeTab" :items="tabs" class="w-full" />

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
          :title="activeTab === 'upcoming' ? $t('appointments.empty.upcomingTitle') : $t('appointments.empty.pastTitle')"
          :description="activeTab === 'upcoming' ? $t('appointments.empty.upcomingDescription') : $t('appointments.empty.pastDescription')"
          icon="i-lucide-calendar"
        />
      </div>

      <div v-else class="divide-y divide-stone-200">
        <div v-for="apt in currentList" :key="apt.id" class="p-4 sm:p-5">
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
              <div class="text-xs uppercase tracking-wide text-stone-500">{{ $t('appointments.labels.branch') }}</div>
              <div class="text-sm text-stone-800">{{ apt.branch?.name || '—' }}</div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-wide text-stone-500">{{ $t('appointments.labels.professional') }}</div>
              <div class="text-sm text-stone-800">{{ apt.professional?.name || '—' }}</div>
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
