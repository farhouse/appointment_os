<script setup lang="ts">
import { loadMe } from '~/composables/useMe'

const route = useRoute()
const { t } = useI18n()

const backToBookUrl = ref('/book')

onMounted(async () => {
  const me = await loadMe()
  if (me?.role === 'CLIENT') backToBookUrl.value = '/private/client/book'
})

const appointmentId = computed(() => String(route.query.appointmentId || ''))

const { data, pending, error, refresh } = useFetch<any>(() => {
  if (!appointmentId.value) return null as any
  return `/api/public/appointments/${encodeURIComponent(appointmentId.value)}`
})

const appt = computed(() => (data.value as any) || null)

const icsUrl = computed(() => {
  if (!appointmentId.value) return ''
  return `/api/public/appointments/${encodeURIComponent(appointmentId.value)}/calendar.ics`
})
</script>

<template>
  <div class="py-10">
    <div class="max-w-3xl mx-auto px-4 space-y-6">
      <div>
        <h1 class="text-3xl font-semibold">{{ t('booking.done.title') }}</h1>
        <p class="mt-2 text-gray-600">{{ t('booking.done.subtitle') }}</p>
      </div>

      <div v-if="pending" class="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
        <USkeleton class="h-6 w-1/2" />
        <USkeleton class="mt-3 h-4 w-full" />
        <USkeleton class="mt-2 h-4 w-2/3" />
      </div>

      <div v-else-if="error" class="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
        <CrudState
          :title="t('admin.common.errorTitle')"
          :description="t('booking.done.loadError')"
          icon="i-lucide-alert-triangle"
          :action-label="t('admin.common.retry')"
          @action="refresh"
        />
      </div>

      <div v-else class="rounded-xl border border-black/10 bg-white p-5 shadow-sm space-y-3">
        <div class="text-sm text-gray-600">{{ t('booking.done.statusHint') }}</div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <div class="text-xs uppercase tracking-wide text-gray-500">{{ t('appointments.labels.branch') }}</div>
            <div class="font-medium">{{ appt?.branch?.name || '—' }}</div>
            <div v-if="appt?.branch?.address" class="text-sm text-gray-600">{{ appt.branch.address }}</div>
          </div>
          <div>
            <div class="text-xs uppercase tracking-wide text-gray-500">{{ t('appointments.labels.professional') }}</div>
            <div class="font-medium">{{ appt?.professional?.name || '—' }}</div>
          </div>
          <div>
            <div class="text-xs uppercase tracking-wide text-gray-500">{{ t('appointments.labels.time') }}</div>
            <div class="font-medium">{{ appt?.startTime ? new Date(appt.startTime).toLocaleString() : '—' }}</div>
          </div>
          <div>
            <div class="text-xs uppercase tracking-wide text-gray-500">{{ t('appointments.labels.services') }}</div>
            <div class="font-medium">{{ (appt?.services || []).map((s:any) => s.service?.name || s.name).join(', ') || '—' }}</div>
          </div>
        </div>

        <div class="pt-2 flex flex-wrap gap-2">
          <UButton v-if="icsUrl" :to="icsUrl" target="_blank" rel="noopener" icon="i-lucide-calendar-plus" variant="outline">
            {{ t('booking.done.addToCalendar') }}
          </UButton>
          <UButton :to="backToBookUrl" icon="i-lucide-arrow-left" variant="ghost">
            {{ t('booking.done.backToBook') }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
