<script setup lang="ts">
const { t } = useI18n()

type Branch = { id: string; name: string; address?: string | null; phone?: string | null }
type Service = { id: string; name: string; description?: string | null; price: any; duration: number }
type Barber = { id: string; name: string; email: string }

type BusySlot = { startTime: string; endTime: string; status: string }

type InitialClient = {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

const props = withDefaults(defineProps<{
  initialBranchId?: string
  initialClient?: InitialClient
  hideDetailsTitle?: boolean
  hideContactTitle?: boolean
}>(), {
  initialBranchId: '',
  initialClient: () => ({}),
  hideDetailsTitle: false,
  hideContactTitle: false,
})

const branches = ref<Branch[]>([])
const services = ref<Service[]>([])
const barbers = ref<Barber[]>([])

const branchId = ref<string>(props.initialBranchId || '')
const serviceId = ref<string>('')
const barberId = ref<string>('')

const date = ref<string>(new Date().toISOString().slice(0, 10)) // YYYY-MM-DD
const busy = ref<BusySlot[]>([])

const clientFirstName = ref(props.initialClient?.firstName || '')
const clientLastName = ref(props.initialClient?.lastName || '')
const clientEmail = ref(props.initialClient?.email || '')
const clientPhone = ref(props.initialClient?.phone || '')

const existingClientUser = ref<{ id: string; name: string; email: string; phone?: string | null } | null>(null)
const showLoginSuggestion = computed(() => !!existingClientUser.value)
const earnPoints = ref(false)

watch(showLoginSuggestion, (v) => {
  if (!v) earnPoints.value = false
})

const selectedStart = ref<string | null>(null) // ISO
const selectedEnd = ref<string | null>(null) // ISO

const loading = ref(false)
const errorMsg = ref<string | null>(null)
const successMsg = ref<string | null>(null)

onMounted(async () => {
  branches.value = await $fetch('/api/public/branches')
  services.value = await $fetch('/api/public/services')
})

// If the host context passes a default branch later, follow it.
watch(() => props.initialBranchId, (id) => {
  if (id && !branchId.value) branchId.value = id
})

watch(() => props.initialClient, (c) => {
  if (!c) return
  if (c.firstName && !clientFirstName.value) clientFirstName.value = c.firstName
  if (c.lastName && !clientLastName.value) clientLastName.value = c.lastName
  if (c.email && !clientEmail.value) clientEmail.value = c.email
  if (c.phone && !clientPhone.value) clientPhone.value = c.phone
}, { deep: true })

let lookupTimer: any = null
watch([clientEmail, clientPhone], ([email, phone]) => {
  existingClientUser.value = null
  if (lookupTimer) clearTimeout(lookupTimer)

  const e = (email || '').trim()
  const p = (phone || '').trim()
  if (!e && !p) return

  lookupTimer = setTimeout(async () => {
    try {
      const query = new URLSearchParams()
      if (e) query.set('email', e)
      if (p) query.set('phone', p)
      const res = await $fetch(`/api/public/users/lookup?${query.toString()}`)
      existingClientUser.value = (res as any)?.user || null
    } catch {
      existingClientUser.value = null
    }
  }, 350)
})

watch(branchId, async (id) => {
  barberId.value = ''
  barbers.value = []
  if (!id) return
  try {
    barbers.value = await $fetch(`/api/public/barbers?branchId=${encodeURIComponent(id)}`)
  } catch {
    barbers.value = []
  }
}, { immediate: true })

watch([branchId, barberId, date], async ([bId, brId, d]) => {
  busy.value = []
  selectedStart.value = null
  selectedEnd.value = null
  if (!bId || !brId || !d) return
  busy.value = (await $fetch(`/api/public/availability?branchId=${encodeURIComponent(bId)}&barberId=${encodeURIComponent(brId)}&date=${encodeURIComponent(d)}`)).busy || []
})

watch(serviceId, () => {
  // Service changes affect duration → previously-selected slot might be invalid
  selectedStart.value = null
  selectedEnd.value = null
})

const selectedService = computed(() => services.value.find(s => s.id === serviceId.value) || null)

const servicePriceLabel = computed(() => {
  const s = selectedService.value
  if (!s) return ''
  const n = typeof s.price === 'string' ? Number(s.price) : Number(s.price)
  if (!Number.isFinite(n)) return ''
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
})

function overlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart
}

const slotDurationMin = computed(() => selectedService.value?.duration || 30)

const availableSlots = computed(() => {
  if (!branchId.value || !barberId.value || !selectedService.value) return [] as { start: Date; end: Date; label: string }[]

  // MVP: working hours 09:00–19:00 local.
  const startDay = new Date(`${date.value}T09:00:00`)
  const endDay = new Date(`${date.value}T19:00:00`)

  const stepMin = 15
  const dur = slotDurationMin.value

  const busyRanges = busy.value.map(b => ({
    start: new Date(b.startTime),
    end: new Date(b.endTime)
  }))

  const slots: { start: Date; end: Date; label: string }[] = []
  const now = new Date()

  for (let cur = new Date(startDay); cur.getTime() + dur * 60000 <= endDay.getTime(); cur = new Date(cur.getTime() + stepMin * 60000)) {
    const end = new Date(cur.getTime() + dur * 60000)

    // Don't allow selecting slots in the past (for today)
    if (cur.getTime() < now.getTime()) continue

    const isBusy = busyRanges.some(r => overlap(cur, end, r.start, r.end))
    if (isBusy) continue
    const label = `${cur.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    slots.push({ start: cur, end, label })
  }

  return slots
})

const detailsComplete = computed(() => {
  return !!(branchId.value && serviceId.value && barberId.value && date.value)
})

const timeComplete = computed(() => {
  return !!(selectedStart.value && selectedEnd.value)
})

const canSubmit = computed(() => {
  return !!(
    detailsComplete.value &&
    timeComplete.value &&
    clientFirstName.value.trim() &&
    clientPhone.value.trim()
  )
})

const slotsEl = ref<HTMLElement | null>(null)
const contactEl = ref<HTMLElement | null>(null)

function scrollTo(el: HTMLElement | null) {
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch(detailsComplete, async (v) => {
  if (!v) return
  await nextTick()
  scrollTo(slotsEl.value)
})

watch(timeComplete, async (v) => {
  if (!v) return
  await nextTick()
  scrollTo(contactEl.value)
})

async function submitBooking() {
  errorMsg.value = null
  successMsg.value = null

  if (!canSubmit.value) {
    errorMsg.value = t('booking.errors.missing')
    return
  }

  loading.value = true
  try {
    const client = await $fetch('/api/public/clients', {
      method: 'POST',
      body: {
        firstName: clientFirstName.value.trim(),
        lastName: clientLastName.value.trim() || undefined,
        email: clientEmail.value.trim() || undefined,
        phone: clientPhone.value.trim() || undefined
      }
    })

    await $fetch('/api/public/appointments', {
      method: 'POST',
      body: {
        branchId: branchId.value,
        clientId: (client as any).id,
        professionalId: barberId.value,
        startTime: selectedStart.value,
        endTime: selectedEnd.value,
        serviceIds: [serviceId.value],
        notifyEmail: !!clientEmail.value.trim(),
        notifySms: !!clientPhone.value.trim()
      }
    })

    successMsg.value = t('booking.success')
  } catch (e: any) {
    errorMsg.value = e?.data?.message || e?.message || t('booking.errors.generic')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-1 space-y-4">
      <div class="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 v-if="!hideDetailsTitle" class="font-semibold mb-3">{{ $t('booking.details') }}</h2>

        <label class="block text-sm font-medium mb-1">{{ $t('booking.branch') }}</label>
        <select v-model="branchId" class="w-full rounded border px-3 py-2 bg-white">
          <option value="">{{ $t('booking.selectBranch') }}</option>
          <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
        </select>

        <div class="flex items-baseline justify-between gap-3 mt-3">
          <label class="block text-sm font-medium">{{ $t('booking.service') }}</label>
          <span v-if="servicePriceLabel" class="text-xs text-gray-600">{{ $t('booking.price') }}: {{ servicePriceLabel }}</span>
        </div>
        <select v-model="serviceId" class="w-full rounded border px-3 py-2 bg-white">
          <option value="">{{ $t('booking.selectService') }}</option>
          <option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>

        <label class="block text-sm font-medium mb-1 mt-3">{{ $t('booking.barber') }}</label>
        <select v-model="barberId" class="w-full rounded border px-3 py-2 bg-white" :disabled="!branchId">
          <option value="">{{ $t('booking.selectBarber') }}</option>
          <option v-for="b in barbers" :key="b.id" :value="b.id">{{ b.name }}</option>
        </select>

        <label class="block text-sm font-medium mb-1 mt-3">{{ $t('booking.date') }}</label>
        <input v-model="date" type="date" class="w-full rounded border px-3 py-2 bg-white" />
      </div>
    </div>

    <div class="lg:col-span-2 space-y-4">
      <div v-if="detailsComplete" class="rounded-xl border border-black/10 bg-white p-5 shadow-sm" ref="slotsEl">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <h2 class="font-semibold">{{ $t('booking.slots') }}</h2>
          <div class="text-sm text-gray-600">
            <span v-if="selectedService">{{ $t('booking.duration') }}: {{ slotDurationMin }} min</span>
          </div>
        </div>

        <div class="mt-1 text-sm text-gray-600">
          {{ $t('booking.pickFirst') }}
        </div>

        <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            v-for="s in availableSlots"
            :key="s.start.toISOString()"
            type="button"
            class="rounded border px-3 py-2 text-sm"
            :class="selectedStart === s.start.toISOString() ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300'"
            @click="() => { selectedStart = s.start.toISOString(); selectedEnd = s.end.toISOString() }"
          >
            {{ s.label }}
          </button>
          <div v-if="availableSlots.length === 0" class="col-span-full text-sm text-gray-600">
            {{ $t('booking.noSlots') }}
          </div>
        </div>
      </div>

      <div v-if="detailsComplete && timeComplete" class="rounded-xl border border-black/10 bg-white p-5 shadow-sm" ref="contactEl">
        <h2 v-if="!hideContactTitle" class="font-semibold mb-3">{{ $t('booking.contact') }}</h2>

        <label class="block text-sm font-medium mb-1">{{ $t('booking.firstName') }}</label>
        <input v-model="clientFirstName" class="w-full rounded border px-3 py-2 bg-white" />

        <label class="block text-sm font-medium mb-1 mt-3">{{ $t('booking.lastName') }}</label>
        <input v-model="clientLastName" class="w-full rounded border px-3 py-2 bg-white" />

        <label class="block text-sm font-medium mb-1 mt-3">{{ $t('booking.email') }}</label>
        <input v-model="clientEmail" type="email" class="w-full rounded border px-3 py-2 bg-white" />

        <label class="block text-sm font-medium mb-1 mt-3">{{ $t('booking.phone') }} *</label>
        <input v-model="clientPhone" class="w-full rounded border px-3 py-2 bg-white" />

        <p class="mt-3 text-xs text-gray-600">{{ $t('booking.contactHint') }}</p>

        <div v-if="showLoginSuggestion" class="mt-3 rounded-lg border border-black/10 bg-gray-50 p-3 text-sm">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="font-medium">{{ $t('booking.existingUser.title') }}</p>
              <p class="text-gray-600">{{ $t('booking.existingUser.subtitle') }}</p>
            </div>
            <label class="flex items-center gap-2 text-xs font-medium select-none whitespace-nowrap">
              <input v-model="earnPoints" type="checkbox" class="accent-current" />
              {{ $t('booking.existingUser.switch') }}
            </label>
          </div>
          <div v-if="earnPoints" class="mt-3">
            <UButton to="/login" variant="outline" size="sm">{{ $t('booking.existingUser.cta') }}</UButton>
          </div>
        </div>

        <div class="mt-5">
          <div v-if="errorMsg" class="mb-3 text-sm text-red-700">{{ errorMsg }}</div>
          <div v-if="successMsg" class="mb-3 text-sm text-green-700">{{ successMsg }}</div>

          <UButton :disabled="!canSubmit || loading" color="primary" @click="submitBooking">
            {{ loading ? $t('booking.saving') : $t('booking.confirm') }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
