<script setup lang="ts">
import { useMeState } from '~/composables/useMe'

const { t } = useI18n()

type Branch = {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  isOpenNow?: boolean
  todayWorkingHours?: { start: string; end: string; isWorking: boolean } | null
}
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

const loadingBranches = ref(false)
const loadingServices = ref(false)
const loadingBarbers = ref(false)
const loadingSlots = ref(false)
const lookingUpUser = ref(false)

const branchId = ref<string>(props.initialBranchId || '')
const serviceId = ref<string>('')
const barberId = ref<string>('')

const date = ref<string>(new Date().toISOString().slice(0, 10)) // YYYY-MM-DD

function parseLocalDate(d: string) {
  // d = YYYY-MM-DD
  return new Date(`${d}T00:00:00`)
}

function formatYmd(dt: Date) {
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseTimeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const dateLabel = computed(() => {
  const dt = parseLocalDate(date.value)
  if (!Number.isFinite(dt.getTime())) return date.value
  return dt.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })
})

function changeDay(deltaDays: number) {
  const dt = parseLocalDate(date.value)
  if (!Number.isFinite(dt.getTime())) return
  dt.setDate(dt.getDate() + deltaDays)

  // Don't allow navigating to past days
  const today = parseLocalDate(new Date().toISOString().slice(0, 10))
  if (dt.getTime() < today.getTime()) return

  date.value = formatYmd(dt)
}

function clearBarberFilter() {
  barberId.value = ''
}
const busy = ref<BusySlot[]>([])
const workingHoursStart = ref<string | null>(null)
const workingHoursEnd = ref<string | null>(null)

const clientFirstName = ref(props.initialClient?.firstName || '')
const clientLastName = ref(props.initialClient?.lastName || '')
const clientEmail = ref(props.initialClient?.email || '')
const clientPhone = ref(props.initialClient?.phone || '')

const existingClientUser = ref<{ id: string; name: string; email: string; phone?: string | null } | null>(null)
const showLoginSuggestion = computed(() => !!existingClientUser.value)

const hasContactInfoForLookup = computed(() => {
  return !!(clientEmail.value.trim() || clientPhone.value.trim())
})

const me = useMeState()
const isLoggedInClient = computed(() => !!me.value && me.value.role === 'CLIENT')

// Only offer account creation once we have some contact info and lookup says: no user.
const showCreateAccountOffer = computed(() => {
  return !isLoggedInClient.value && hasContactInfoForLookup.value && !lookingUpUser.value && !showLoginSuggestion.value
})

// If user doesn't exist, allow opt-in account creation.
const createAccount = ref(false)
const accountPassword = ref('')
const accountPassword2 = ref('')

// If user exists, we can suggest login.
const earnPoints = ref(false)

watch(showLoginSuggestion, (v) => {
  if (!v) earnPoints.value = false
})

watch(createAccount, (v) => {
  if (!v) {
    accountPassword.value = ''
    accountPassword2.value = ''
  }
})

watch(showCreateAccountOffer, (v) => {
  if (!v) createAccount.value = false
})

watch(isLoggedInClient, (v) => {
  if (v) {
    createAccount.value = false
    earnPoints.value = false
  }
})

const selectedStart = ref<string | null>(null) // ISO
const selectedEnd = ref<string | null>(null) // ISO

const loading = ref(false)
const errorMsg = ref<string | null>(null)
const successMsg = ref<string | null>(null)

onMounted(async () => {
  loadingBranches.value = true
  loadingServices.value = true
  try {
    const [b, s] = await Promise.all([
      $fetch('/api/public/branches'),
      $fetch('/api/public/services')
    ])
    branches.value = b as any
    services.value = s as any
  } finally {
    loadingBranches.value = false
    loadingServices.value = false
  }
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
    lookingUpUser.value = true
    try {
      const query = new URLSearchParams()
      if (e) query.set('email', e)
      if (p) query.set('phone', p)
      const res = await $fetch(`/api/public/users/lookup?${query.toString()}`)
      existingClientUser.value = (res as any)?.user || null
    } catch {
      existingClientUser.value = null
    } finally {
      lookingUpUser.value = false
    }
  }, 350)
})

watch(branchId, async (id) => {
  barberId.value = ''
  barbers.value = []

  if (!id) {
    loadingBarbers.value = false
    return
  }

  loadingBarbers.value = true
  try {
    barbers.value = await $fetch(`/api/public/barbers?branchId=${encodeURIComponent(id)}`)
  } catch {
    barbers.value = []
  } finally {
    // keep it visible at least a tick so it doesn't feel broken
    await nextTick()
    loadingBarbers.value = false
  }
}, { immediate: true })

watch([branchId, barberId, date], async ([bId, brId, d]) => {
  busy.value = []
  selectedStart.value = null
  selectedEnd.value = null

  if (!bId || !d) {
    loadingSlots.value = false
    return
  }

  loadingSlots.value = true
  try {
    const availability = await $fetch(`/api/public/availability?branchId=${encodeURIComponent(bId)}&barberId=${encodeURIComponent(brId || '')}&date=${encodeURIComponent(d)}`)
    busy.value = (availability as any).busy || []
    workingHoursStart.value = (availability as any).workingHours?.start || null
    workingHoursEnd.value = (availability as any).workingHours?.end || null
  } catch {
    busy.value = []
    workingHoursStart.value = null
    workingHoursEnd.value = null
  } finally {
    await nextTick()
    loadingSlots.value = false
  }
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

const workingStartMin = computed(() => workingHoursStart.value ? parseTimeToMinutes(workingHoursStart.value) : null)
const workingEndMin = computed(() => workingHoursEnd.value ? parseTimeToMinutes(workingHoursEnd.value) : null)

const timelineStartHour = computed(() => {
  if (workingStartMin.value == null) return 9
  return Math.floor(workingStartMin.value / 60)
})

const timelineEndHour = computed(() => {
  if (workingEndMin.value == null) return 19
  return Math.ceil(workingEndMin.value / 60)
})

const timelineHours = computed(() => {
  const start = timelineStartHour.value
  const end = Math.max(start + 1, timelineEndHour.value)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

const timelineTotalMinutes = computed(() => {
  if (workingStartMin.value == null || workingEndMin.value == null) return 10 * 60
  return Math.max(60, workingEndMin.value - workingStartMin.value)
})

const availableSlots = computed(() => {
  if (!branchId.value || !barberId.value || !selectedService.value) return [] as { start: Date; end: Date; label: string }[]

  if (!workingHoursStart.value || !workingHoursEnd.value) return []

  const whStart = workingHoursStart.value
  const whEnd = workingHoursEnd.value

  const startDay = new Date(`${date.value}T${whStart}:00`)
  const endDay = new Date(`${date.value}T${whEnd}:00`)

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
    clientEmail.value.trim() &&
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

async function fetchWithRetry<T>(url: string, opts: any, retries = 1): Promise<T> {
  try {
    return await $fetch<T>(url, opts)
  } catch (e: any) {
    const msg = String(e?.message || '')
    const isNetwork = msg.includes('Failed to fetch') || msg.includes('fetch failed')
    if (retries > 0 && isNetwork) {
      await new Promise((r) => setTimeout(r, 700))
      return await fetchWithRetry<T>(url, opts, retries - 1)
    }
    throw e
  }
}

async function submitBooking() {
  errorMsg.value = null
  successMsg.value = null

  if (!canSubmit.value) {
    errorMsg.value = t('booking.errors.missing')
    return
  }

  // If opting into account creation, validate passwords client-side.
  if (createAccount.value) {
    if (accountPassword.value.length < 6) {
      errorMsg.value = t('booking.errors.passwordShort')
      return
    }
    if (accountPassword.value !== accountPassword2.value) {
      errorMsg.value = t('booking.errors.passwordMismatch')
      return
    }
  }

  loading.value = true
  try {
    // Create/reuse Client (business entity)
    const client = await fetchWithRetry<any>('/api/public/clients', {
      method: 'POST',
      body: {
        firstName: clientFirstName.value.trim(),
        lastName: clientLastName.value.trim() || undefined,
        email: clientEmail.value.trim(),
        phone: clientPhone.value.trim() || undefined
      }
    })

    // Optional: create auth account (User role CLIENT)
    if (createAccount.value && !showLoginSuggestion.value) {
      await fetchWithRetry('/api/public/users/register', {
        method: 'POST',
        body: {
          email: clientEmail.value.trim(),
          phone: clientPhone.value.trim() || undefined,
          firstName: clientFirstName.value.trim(),
          lastName: clientLastName.value.trim() || undefined,
          password: accountPassword.value
        }
      })
    }

    const apt = await fetchWithRetry<any>('/api/public/appointments', {
      method: 'POST',
      body: {
        branchId: branchId.value,
        clientId: (client as any).id,
        professionalId: barberId.value,
        startTime: selectedStart.value,
        endTime: selectedEnd.value,
        serviceIds: [serviceId.value],
        notifyEmail: true,
        notifySms: !!clientPhone.value.trim()
      }
    })

    successMsg.value = t('booking.success')

    const appointmentId = (apt as any)?.id
    const target = { path: '/book/done', query: { appointmentId } }
    try {
      await navigateTo(target)
    } catch {
      // Fallback: hard navigation (dev HMR / edge cases)
      const q = appointmentId ? `?appointmentId=${encodeURIComponent(String(appointmentId))}` : ''
      window.location.assign(`/book/done${q}`)
    }
  } catch (e: any) {
    const msg = String(e?.data?.message || e?.message || '')
    errorMsg.value = msg || t('booking.errors.generic')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
    <!-- Left column: details + contact (on large screens, contact sits under details) -->
    <div class="lg:col-span-2 space-y-4">
      <div class="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 v-if="!hideDetailsTitle" class="font-semibold mb-3">{{ $t('booking.details') }}</h2>

        <div class="flex items-center justify-between gap-3 mb-1">
          <label class="block text-sm font-medium">{{ $t('booking.branch') }}</label>
          <span v-if="loadingBranches" class="text-xs text-gray-500 inline-flex items-center gap-2">
            <span class="i-lucide-loader-2 animate-spin" />
            {{ $t('common.loading') }}
          </span>
        </div>
        <div class="mt-2" role="radiogroup" :aria-label="$t('booking.branch')">
          <div class="space-y-2">
            <button
              v-for="b in branches"
              :key="b.id"
              type="button"
              role="radio"
              :aria-checked="branchId === b.id"
              :disabled="loadingBranches"
              class="w-full rounded-lg border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              :class="branchId === b.id
                ? 'border-transparent bg-[var(--ui-primary)] text-white shadow-sm'
                : 'border-gray-300 bg-white text-gray-800 hover:border-gray-400'"
              @click="branchId = b.id"
            >
              <div class="text-sm font-semibold leading-tight">{{ b.name }}</div>
              <div
                v-if="b.address"
                class="text-xs"
                :class="branchId === b.id ? 'text-white/80' : 'text-gray-500'"
              >
                {{ b.address }}
              </div>
              <div
                v-if="b.todayWorkingHours"
                class="text-[11px] mt-1"
                :class="branchId === b.id ? 'text-white/80' : (b.isOpenNow ? 'text-emerald-700' : 'text-gray-500')"
              >
                <template v-if="b.todayWorkingHours.isWorking">
                  {{ b.isOpenNow ? 'Abierta ahora' : 'Hoy' }} · {{ b.todayWorkingHours.start }} - {{ b.todayWorkingHours.end }}
                </template>
                <template v-else>
                  Cerrada hoy
                </template>
              </div>
            </button>
          </div>
          <p v-if="!branches.length && !loadingBranches" class="mt-2 text-xs text-gray-500">
            {{ $t('booking.selectBranch') }}
          </p>
        </div>

        <div class="flex items-baseline justify-between gap-3 mt-3">
          <label class="block text-sm font-medium">{{ $t('booking.service') }}</label>
          <div class="flex items-center gap-3">
            <span v-if="loadingServices" class="text-xs text-gray-500 inline-flex items-center gap-2">
              <span class="i-lucide-loader-2 animate-spin" />
              {{ $t('common.loading') }}
            </span>
            <span v-if="servicePriceLabel" class="text-xs text-gray-600">{{ $t('booking.price') }}: {{ servicePriceLabel }}</span>
          </div>
        </div>
        <div class="mt-2" role="radiogroup" :aria-label="$t('booking.service')">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="s in services"
              :key="s.id"
              type="button"
              role="radio"
              :aria-checked="serviceId === s.id"
              :disabled="loadingServices"
              class="rounded-full border px-3 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              :class="serviceId === s.id
                ? 'border-transparent bg-[var(--ui-primary)] text-white shadow-sm'
                : 'border-gray-300 bg-white text-gray-800 hover:border-gray-400'"
              @click="serviceId = s.id"
            >
              {{ s.name }} · {{ s.duration }} min
            </button>
          </div>
          <p v-if="!services.length && !loadingServices" class="mt-2 text-xs text-gray-500">
            {{ $t('booking.selectService') }}
          </p>
        </div>

        <div class="flex items-center justify-between gap-3 mb-1 mt-3">
          <label class="block text-sm font-medium">{{ $t('booking.barber') }}</label>
          <span v-if="loadingBarbers" class="text-xs text-gray-500 inline-flex items-center gap-2">
            <span class="i-lucide-loader-2 animate-spin" />
            {{ $t('common.loading') }}
          </span>
        </div>
        <div class="mt-2" role="radiogroup" :aria-label="$t('booking.barber')">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="b in barbers"
              :key="b.id"
              type="button"
              role="radio"
              :aria-checked="barberId === b.id"
              :disabled="!branchId || loadingBarbers"
              class="rounded-full border px-3 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              :class="barberId === b.id
                ? 'border-transparent bg-[var(--ui-primary)] text-white shadow-sm'
                : 'border-gray-300 bg-white text-gray-800 hover:border-gray-400'
              "
              @click="barberId = b.id"
            >
              {{ b.name }}
            </button>
          </div>
          <p v-if="branchId && !barbers.length && !loadingBarbers" class="mt-2 text-xs text-gray-500">
            {{ $t('booking.selectBarber') }}
          </p>
        </div>

        <label class="block text-sm font-medium mb-1 mt-3">{{ $t('booking.date') }}</label>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-2 rounded border border-gray-300 text-sm"
            @click="changeDay(-1)"
          >
            {{ $t('calendar.labels.previous') }}
          </button>
          <div class="flex-1 text-center text-sm font-semibold text-gray-900">
            {{ dateLabel }}
          </div>
          <button
            type="button"
            class="px-3 py-2 rounded border border-gray-300 text-sm"
            @click="changeDay(1)"
          >
            {{ $t('calendar.labels.next') }}
          </button>
        </div>
      </div>

      <!-- Contact (shown under details on lg+) -->
      <div v-if="detailsComplete && timeComplete" class="rounded-xl border border-black/10 bg-white p-5 shadow-sm" ref="contactEl">
        <h2 v-if="!hideContactTitle" class="font-semibold mb-3">{{ $t('booking.contact') }}</h2>

        <label class="block text-sm font-medium mb-1">{{ $t('booking.firstName') }}</label>
        <input v-model="clientFirstName" class="w-full rounded border px-3 py-2 bg-white" />

        <label class="block text-sm font-medium mb-1 mt-3">{{ $t('booking.lastName') }}</label>
        <input v-model="clientLastName" class="w-full rounded border px-3 py-2 bg-white" />

        <label class="block text-sm font-medium mb-1 mt-3">{{ $t('booking.email') }} *</label>
        <input v-model="clientEmail" type="email" class="w-full rounded border px-3 py-2 bg-white" />

        <label class="block text-sm font-medium mb-1 mt-3">{{ $t('booking.phone') }} *</label>
        <input v-model="clientPhone" class="w-full rounded border px-3 py-2 bg-white" />

        <div class="mt-3 flex items-center justify-between gap-3">
          <p class="text-xs text-gray-600">{{ $t('booking.contactHint') }}</p>
          <span v-if="lookingUpUser" class="text-xs text-gray-500 inline-flex items-center gap-2">
            <span class="i-lucide-loader-2 animate-spin" />
            {{ $t('common.loading') }}
          </span>
        </div>

        <div v-if="showCreateAccountOffer" class="mt-3 rounded-lg border border-black/10 bg-gray-50 p-3 text-sm">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="font-medium">{{ $t('booking.newUser.title') }}</p>
              <p class="text-gray-600">{{ $t('booking.newUser.subtitle') }}</p>
            </div>
            <label class="flex items-center gap-2 text-xs font-medium select-none whitespace-nowrap">
              <input v-model="createAccount" type="checkbox" class="accent-current" />
              {{ $t('booking.newUser.switch') }}
            </label>
          </div>

          <div v-if="createAccount" class="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <div class="text-xs text-gray-600 mb-1">{{ $t('booking.newUser.password') }}</div>
              <input v-model="accountPassword" type="password" class="w-full rounded border px-3 py-2 bg-white" />
            </div>
            <div>
              <div class="text-xs text-gray-600 mb-1">{{ $t('booking.newUser.password2') }}</div>
              <input v-model="accountPassword2" type="password" class="w-full rounded border px-3 py-2 bg-white" />
            </div>
          </div>
        </div>

        <div v-else-if="showLoginSuggestion && !isLoggedInClient" class="mt-3 rounded-lg border border-black/10 bg-gray-50 p-3 text-sm">
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

    <!-- Right column: slots -->
    <div class="lg:col-span-3 space-y-4">
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

        <div v-if="loadingSlots" class="mt-4">
          <CrudState
            :title="$t('common.loading')"
            :description="$t('common.loading')"
            icon="i-lucide-loader-2"
          />
        </div>

        <div v-else-if="availableSlots.length === 0" class="mt-4 space-y-3">
          <CrudState
            :title="$t('booking.noSlots')"
            :description="$t('booking.noSlotsHint')"
            icon="i-lucide-calendar-x"
          />

          <div class="rounded-lg border border-black/10 bg-gray-50 p-3">
            <p class="text-sm font-medium text-gray-800">{{ $t('booking.noSlotsCta.title') }}</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <UButton size="sm" variant="soft" icon="i-lucide-arrow-right" @click="changeDay(1)">
                {{ $t('booking.noSlotsCta.nextDay') }}
              </UButton>
              <UButton
                size="sm"
                variant="outline"
                icon="i-lucide-scissors"
                :disabled="!barberId"
                @click="clearBarberFilter"
              >
                {{ $t('booking.noSlotsCta.anyBarber') }}
              </UButton>
            </div>
          </div>
        </div>

        <!-- Day timeline (calendar-like) -->
        <div v-else class="mt-4">
          <div class="scrollbar-nice relative rounded-lg border border-gray-200 bg-white overflow-y-auto" style="height: 520px;">
            <!-- Time rail -->
            <div class="absolute inset-0 grid" :style="{ gridTemplateRows: `repeat(${Math.max(1, timelineHours.length - 1)}, 1fr)` }">
              <div v-for="h in Math.max(1, timelineHours.length - 1)" :key="h" class="border-t border-gray-100"></div>
            </div>

            <!-- Labels -->
            <div class="absolute left-0 top-0 bottom-0 w-14 border-r border-gray-100 bg-gray-50">
              <div v-for="hour in timelineHours" :key="hour" class="relative" :style="{ height: (520 / Math.max(1, timelineHours.length - 1)) + 'px' }">
                <div class="absolute -top-2 left-2 text-[10px] text-gray-600">
                  {{ String(hour).padStart(2, '0') }}:00
                </div>
              </div>
            </div>

            <!-- Slots layer -->
            <div class="absolute left-14 right-0 top-0 bottom-0">
              <button
                v-for="s in availableSlots"
                :key="s.start.toISOString()"
                type="button"
                class="absolute left-2 right-2 rounded border"
                :title="`${s.label} (${slotDurationMin} min)`"
                :class="selectedStart === s.start.toISOString() ? '' : 'border-gray-300 hover:border-gray-400 bg-white'"
                :style="(() => {
                  const baseMinutes = workingStartMin ?? 9 * 60
                  const slotMinutes = s.start.getHours() * 60 + s.start.getMinutes()
                  const minutesFromStart = slotMinutes - baseMinutes
                  const pxPerMin = 520 / timelineTotalMinutes
                  const top = Math.max(0, minutesFromStart * pxPerMin)
                  const height = Math.max(18, slotDurationMin * pxPerMin)
                  const isSelected = selectedStart === s.start.toISOString()
                  return {
                    top: top + 'px',
                    height: height + 'px',
                    zIndex: isSelected ? 10 : 1,
                    backgroundColor: isSelected ? 'var(--ui-primary)' : undefined,
                    borderColor: isSelected ? 'var(--ui-primary)' : undefined,
                    boxShadow: isSelected ? '0 0 0 2px color-mix(in oklab, var(--ui-primary), #ffffff 35%)' : undefined,
                  }
                })()"
                @click="() => { selectedStart = s.start.toISOString(); selectedEnd = s.end.toISOString() }"
              />

              <div v-if="availableSlots.length === 0" class="p-3 text-sm text-gray-600">
                {{ $t('booking.noSlots') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  </div>
</template>
