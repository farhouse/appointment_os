<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useSelectedBranch } from '~/composables/useSelectedBranch'
import { loadMe, useMeState } from '~/composables/useMe'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN', 'MANAGER'],
})

type CashBox = {
  id: string
  name: string
}

type CashSession = {
  id: string
  branchId: string
  cashBoxId?: string | null
  openingBalance: string
  closingBalance?: string | null
  closingCash?: string | null
  closingCard?: string | null
  closingTransfer?: string | null
  closingOther?: string | null
  openingTime: string
  closingTime?: string | null
  openedByName?: string | null
  totalAmount?: number | null
  totalsByMethod?: Record<string, number>
  lastMovement?: CashMovement | null
  cashBox?: CashBox | null
  movements: CashMovement[]
  branch?: { id: string; name: string } | null
}

type CashMovement = {
  id: string
  amount: string
  type: 'DEPOSIT' | 'WITHDRAWAL'
  paymentMethod?: 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER'
  reason?: string | null
  createdAt: string
}

const { t } = useI18n()
const { selectedBranchId } = useSelectedBranch()
const toast = useToast()
const me = useMeState()

const cashBoxes = ref<CashBox[]>([])
const sessions = ref<CashSession[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const paymentMethods = ref<{ method: string; label: string; active: boolean }[]>([])
const paymentMedia = ref<{ id: string; method: string; name: string; active: boolean; isSystem: boolean }[]>([])

const selectedCashBoxId = ref('')
const selectedSession = computed(() => sessions.value.find(s => s.branchId === selectedBranchId.value && !s.closingTime) || null)
const sessionStatus = computed(() => (selectedSession.value ? 'OPEN' : 'CLOSED'))

const openSessions = computed(() => sessions.value.filter(s => !s.closingTime))
const openSessionsSorted = computed(() => {
  return [...openSessions.value].sort((a, b) => {
    const aTime = new Date(a.openingTime).getTime()
    const bTime = new Date(b.openingTime).getTime()
    return aTime - bTime
  })
})
const selectedBranchOpenSessions = computed(() => openSessionsSorted.value.filter(s => s.branchId === selectedBranchId.value))
const globalOpenSessionsSorted = computed(() => {
  return openSessionsSorted.value.filter(s => s.branchId !== selectedBranchId.value)
})

const isAdmin = computed(() => me.value?.role === 'OWNER' || me.value?.role === 'ADMIN')
const sessionFrom = ref('')
const sessionTo = ref('')

const sessionsForList = computed(() => {
  const fromTs = sessionFrom.value ? new Date(`${sessionFrom.value}T00:00:00`).getTime() : null
  const toTs = sessionTo.value ? new Date(`${sessionTo.value}T23:59:59`).getTime() : null

  return sessions.value.filter((session) => {
    const ts = new Date(session.openingTime).getTime()
    if (fromTs != null && ts < fromTs) return false
    if (toTs != null && ts > toTs) return false
    return true
  })
})


const openSchema = z.object({
  cashBoxId: z.string().optional().nullable(),
  openingAmount: z.number().min(0)
})

const closeSchema = z.object({
  countedCash: z.number().min(0),
  countedCard: z.number().min(0).optional(),
  countedTransfer: z.number().min(0).optional(),
  countedOther: z.number().min(0).optional()
})

const movementSchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'OTHER']),
  paymentMediumId: z.string().optional().nullable(),
  amount: z.number().positive(),
  reason: z.string().optional().nullable()
})

type OpenForm = z.output<typeof openSchema>
type CloseForm = z.output<typeof closeSchema>
type MovementForm = z.output<typeof movementSchema>

const openForm = reactive<Partial<OpenForm>>({
  cashBoxId: '',
  openingAmount: 0
})

const closeForm = reactive<Partial<CloseForm>>({
  countedCash: 0,
  countedCard: 0,
  countedTransfer: 0,
  countedOther: 0
})

const movementForm = reactive<Partial<MovementForm>>({
  type: 'DEPOSIT',
  paymentMethod: 'CASH',
  paymentMediumId: undefined,
  amount: 0,
  reason: ''
})

const openingModal = ref(false)
const closingModal = ref(false)
const movementModal = ref(false)
const openFormRef = useTemplateRef('openFormRef')
const closeFormRef = useTemplateRef('closeFormRef')
const movementFormRef = useTemplateRef('movementFormRef')

const isSaving = ref(false)
const route = useRoute()
const router = useRouter()

const movementItems = computed(() => [
  { label: t('manager.cash.deposit'), value: 'DEPOSIT' },
  { label: t('manager.cash.withdrawal'), value: 'WITHDRAWAL' }
])

const paymentMethodItems = computed(() => {
  if (paymentMethods.value.length) {
    return paymentMethods.value
      .filter(method => method.active)
      .map(method => ({ label: method.label, value: method.method }))
  }
  return [
    { label: t('manager.cash.methodCash'), value: 'CASH' },
    { label: t('manager.cash.methodCard'), value: 'CARD' },
    { label: t('manager.cash.methodTransfer'), value: 'TRANSFER' },
    { label: t('manager.cash.methodOther'), value: 'OTHER' }
  ]
})

const sectorOrder = computed(() => {
  if (paymentMethods.value.length) {
    return paymentMethods.value
      .filter(method => method.active)
      .map(method => method.method)
  }
  return ['CASH', 'CARD', 'TRANSFER', 'OTHER']
})

const hasActivePaymentMethods = computed(() => {
  if (!paymentMethods.value.length) return true
  return paymentMethods.value.some(method => method.active)
})

const paymentMediumItems = computed(() => {
  return paymentMedia.value
    .filter(item => item.active && item.method === movementForm.paymentMethod)
    .map(item => ({ label: item.name, value: item.id }))
})

function getMethodLabel(method: string) {
  switch (method) {
    case 'CARD':
      return t('manager.cash.methodCard')
    case 'TRANSFER':
      return t('manager.cash.methodTransfer')
    case 'OTHER':
      return t('manager.cash.methodOther')
    default:
      return t('manager.cash.methodCash')
  }
}


watch(selectedBranchId, () => {
  if (!selectedBranchId.value) return
  const queryCashBoxId = typeof route.query.cashBoxId === 'string' ? route.query.cashBoxId : ''
  if (!queryCashBoxId) selectedCashBoxId.value = ''
  void loadCashboxes()
  void loadSessions()
})

watch(isAdmin, (value) => {
  if (!value) return
  if (selectedBranchId.value) void loadSessions()
})

watch(selectedBranchId, (value, prev) => {
  if (!value || value === prev) return
  const querySessionId = typeof route.query.sessionId === 'string' ? route.query.sessionId : ''
  const queryCashBoxId = typeof route.query.cashBoxId === 'string' ? route.query.cashBoxId : ''
  if (querySessionId || queryCashBoxId) {
    if (!closingModal.value) openCloseModal()
  }
})

watch(
  () => route.query,
  (query) => {
    const branchId = typeof query.branchId === 'string' ? query.branchId : ''
    if (branchId && branchId !== selectedBranchId.value) {
      selectedBranchId.value = branchId
    }

    const cashBoxId = typeof query.cashBoxId === 'string' ? query.cashBoxId : ''
    if (cashBoxId && cashBoxId !== selectedCashBoxId.value) {
      selectedCashBoxId.value = cashBoxId
    }

    sessionFrom.value = typeof query.from === 'string' ? query.from : ''
    sessionTo.value = typeof query.to === 'string' ? query.to : ''
  },
  { immediate: true }
)

watch(selectedCashBoxId, (value) => {
  openForm.cashBoxId = value
})

watch(() => movementForm.paymentMethod, (method) => {
  const first = paymentMedia.value.find(item => item.active && item.method === method)
  movementForm.paymentMediumId = first?.id
})


async function loadCashboxes() {
  if (!selectedBranchId.value) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    const query = new URLSearchParams({ branchId: selectedBranchId.value, activeOnly: 'true' })
    cashBoxes.value = await $fetch(`/api/cashboxes?${query.toString()}`)
  } catch (e: any) {
    cashBoxes.value = []
    errorMessage.value = e?.data?.statusMessage || t('admin.common.loadError')
  } finally {
    isLoading.value = false
  }
}

async function loadPaymentMethods() {
  try {
    const response = await $fetch('/api/settings/payment-methods')
    const methods = response?.methods || []
    const media = response?.media || []
    const labelMap: Record<string, string> = {
      CASH: t('manager.cash.methodCash'),
      CARD: t('manager.cash.methodCard'),
      TRANSFER: t('manager.cash.methodTransfer'),
      OTHER: t('manager.cash.methodOther')
    }
    const defaultOrder = ['CASH', 'CARD', 'TRANSFER', 'OTHER'] as const
    paymentMethods.value = methods
      .map((method: { method: string; active: boolean }) => ({
        method: method.method,
        active: method.active,
        label: labelMap[method.method] || method.method
      }))
      .sort((a, b) => defaultOrder.indexOf(a.method) - defaultOrder.indexOf(b.method))

    paymentMedia.value = media
      .map((item: any) => ({
        id: item.id,
        method: item.method,
        name: item.name,
        active: item.active,
        isSystem: item.isSystem
      }))
      .sort((a, b) => defaultOrder.indexOf(a.method) - defaultOrder.indexOf(b.method))
  } catch {
    paymentMethods.value = []
    paymentMedia.value = []
  }
}

async function loadSessions() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const query = new URLSearchParams()
    if (selectedBranchId.value) query.set('branchId', selectedBranchId.value)
    if (sessionFrom.value) query.set('from', sessionFrom.value)
    if (sessionTo.value) query.set('to', sessionTo.value)
    query.set('includeTotals', 'true')
    if (isAdmin.value) query.set('includeBranch', 'true')
    const scopedSessions = await $fetch<CashSession[]>(`/api/cash/sessions?${query.toString()}`)

    if (!isAdmin.value) {
      sessions.value = scopedSessions
      return
    }

    const globalQuery = new URLSearchParams({ status: 'OPEN', includeTotals: 'true', includeBranch: 'true' })
    const globalSessions = await $fetch<CashSession[]>(`/api/cash/sessions?${globalQuery.toString()}`)

    const map = new Map<string, CashSession>()
    for (const session of globalSessions || []) map.set(session.id, session)
    for (const session of scopedSessions || []) map.set(session.id, session)
    sessions.value = Array.from(map.values())
  } catch (e: any) {
    sessions.value = []
    errorMessage.value = e?.data?.statusMessage || t('admin.common.loadError')
  } finally {
    isLoading.value = false
  }
}

function openOpenModal() {
  openForm.openingAmount = 0
  openForm.cashBoxId = selectedCashBoxId.value || ''
  openingModal.value = true
}

function openOpenModalFor(cashBoxId: string) {
  selectedCashBoxId.value = cashBoxId
  openOpenModal()
}

function openCloseModal() {
  closeForm.countedCash = 0
  closingModal.value = true
}

function openCloseModalFor(cashBoxId: string) {
  selectedCashBoxId.value = cashBoxId
  openCloseModal()
}

function openMovementModal() {
  movementForm.type = 'DEPOSIT'
  const activeMethod = paymentMethods.value.find(method => method.active)?.method || 'CASH'
  movementForm.paymentMethod = activeMethod
  movementForm.paymentMediumId = paymentMedia.value.find(item => item.active && item.method === activeMethod)?.id
  movementForm.amount = 0
  movementForm.reason = ''
  movementModal.value = true
}

async function submitOpen(event: FormSubmitEvent<OpenForm>) {
  if (!selectedBranchId.value) return
  isSaving.value = true
  try {
    await $fetch('/api/cash/sessions/open', {
      method: 'POST',
      body: {
        branchId: selectedBranchId.value,
        cashBoxId: event.data.cashBoxId || undefined,
        openingAmount: event.data.openingAmount
      }
    })
    toast.add({ title: t('manager.cash.openSuccess'), color: 'success' })
    openingModal.value = false
    await loadSessions()
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || t('admin.common.saveError'), color: 'error' })
  } finally {
    isSaving.value = false
  }
}

async function submitClose(event: FormSubmitEvent<CloseForm>) {
  if (!selectedSession.value) return
  isSaving.value = true
  try {
    await $fetch(`/api/cash/sessions/${selectedSession.value.id}/close`, {
      method: 'POST',
      body: event.data
    })
    toast.add({ title: t('manager.cash.closeSuccess'), color: 'success' })
    closingModal.value = false
    await loadSessions()
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || t('admin.common.saveError'), color: 'error' })
  } finally {
    isSaving.value = false
  }
}

async function submitMovement(event: FormSubmitEvent<MovementForm>) {
  if (!selectedSession.value) return
  if (!hasActivePaymentMethods.value) {
    toast.add({ title: t('manager.cash.noActiveMethods'), color: 'error' })
    return
  }
  isSaving.value = true
  try {
    await $fetch('/api/cash/movements', {
      method: 'POST',
      body: {
        sessionId: selectedSession.value.id,
        amount: event.data.amount,
        type: event.data.type,
        paymentMethod: event.data.paymentMethod,
        paymentMediumId: event.data.paymentMediumId,
        reason: event.data.reason
      }
    })
    toast.add({ title: t('manager.cash.movementSuccess'), color: 'success' })
    movementModal.value = false
    await loadSessions()
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || t('admin.common.saveError'), color: 'error' })
  } finally {
    isSaving.value = false
  }
}

async function applySessionDateFilter() {
  await router.replace({
    query: {
      ...route.query,
      ...(sessionFrom.value ? { from: sessionFrom.value } : { from: undefined }),
      ...(sessionTo.value ? { to: sessionTo.value } : { to: undefined })
    }
  })
  await loadSessions()
}

async function clearSessionDateFilter() {
  sessionFrom.value = ''
  sessionTo.value = ''
  await router.replace({
    query: {
      ...route.query,
      from: undefined,
      to: undefined
    }
  })
  await loadSessions()
}

function toNumber(value: string | number | null | undefined) {
  if (value == null) return 0
  const n = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(n) ? n : 0
}

function formatCurrency(value: string | number | null | undefined) {
  if (value == null) return '—'
  const n = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(n)) return String(value)
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

function getLastMovement(session: CashSession | null) {
  if (!session?.movements?.length) return null
  return session.movements.reduce((latest, current) => {
    if (!latest) return current
    const latestTime = new Date(latest.createdAt).getTime()
    const currentTime = new Date(current.createdAt).getTime()
    return currentTime > latestTime ? current : latest
  }, session.movements[0])
}

function getTotalsByMethod(session: CashSession | null) {
  return session?.totalsByMethod || {}
}

function getSessionCurrentBalance(session: CashSession | null) {
  if (!session) return null
  // If session is closed and closingBalance exists, prefer that.
  if (session.closingTime && session.closingBalance != null) return toNumber(session.closingBalance)

  const opening = toNumber(session.openingBalance)
  const total = session.totalAmount != null
    ? Number(session.totalAmount)
    : (session.movements || []).reduce((acc, m) => acc + toNumber(m.amount), 0)

  return opening + total
}

function buildCloseUrl(session: CashSession) {
  const params = new URLSearchParams()
  if (session.branchId) params.set('branchId', session.branchId)
  if (session.cashBoxId) params.set('cashBoxId', session.cashBoxId)
  if (session.id) params.set('sessionId', session.id)
  return `/private/backoffice/cash?${params.toString()}#close-session`
}

function getCashBoxOpenSession(cashBoxId: string) {
  return sessions.value.find(session => session.cashBoxId === cashBoxId && !session.closingTime) || null
}

function getCashBoxCurrentBalance(cashBoxId: string) {
  return getSessionCurrentBalance(getCashBoxOpenSession(cashBoxId))
}

function getCashBoxLastMovement(cashBoxId: string) {
  return getLastMovement(getCashBoxOpenSession(cashBoxId))
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })
}

onMounted(() => {
  void loadMe()
  if (selectedBranchId.value) {
    void loadCashboxes()
    void loadSessions()
  }
  void loadPaymentMethods()
})

watch(openSessionsSorted, (value) => {
  if (!value.length) return
  const queryCashBoxId = typeof route.query.cashBoxId === 'string' ? route.query.cashBoxId : ''
  const querySessionId = typeof route.query.sessionId === 'string' ? route.query.sessionId : ''
  if (!queryCashBoxId && !querySessionId) return
  const target = value.find(session => (
    (queryCashBoxId && session.cashBoxId === queryCashBoxId)
    || (querySessionId && session.id === querySessionId)
  )) || null
  if (!target) return
  if (!closingModal.value) openCloseModalFor(target.cashBoxId || '')
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">{{ $t('pages.private.managerCash') }}</h1>
      <p class="text-sm text-gray-600">{{ $t('manager.cash.subtitle') }}</p>
    </div>

    <section class="space-y-4">
      <div>
        <h2 class="text-lg font-semibold text-stone-900">Uso de Caja del día</h2>
        <p class="text-sm text-stone-600">Sesión diaria por sucursal con sectores por método de pago.</p>
      </div>

      <div class="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <div class="text-sm font-semibold text-stone-900">Estado de sesión</div>
              <UBadge :color="sessionStatus === 'OPEN' ? 'success' : 'neutral'" variant="subtle" class="text-[10px]">
                {{ sessionStatus }}
              </UBadge>
            </div>
            <div class="mt-1 text-xs text-stone-500">
              <span class="font-medium text-stone-600">Abrió:</span>
              {{ selectedSession?.openedByName || '—' }}
            </div>
            <div class="text-xs text-stone-500">
              <span class="font-medium text-stone-600">Apertura:</span>
              {{ formatDate(selectedSession?.openingTime) }}
            </div>
          </div>

          <div class="text-right">
            <div class="text-sm text-stone-500">Balance actual</div>
            <div class="text-base font-semibold text-stone-900">
              {{ formatCurrency(getSessionCurrentBalance(selectedSession)) }}
            </div>
            <div class="text-xs text-stone-500">
              <template v-if="selectedSession">Sesión abierta</template>
              <template v-else>Sin sesión abierta</template>
            </div>
          </div>

          <div class="text-right">
            <div class="text-sm text-stone-500">Último movimiento</div>
            <div class="text-sm font-medium text-stone-900">
              <template v-if="selectedSession?.lastMovement">
                {{ formatDate(selectedSession?.lastMovement?.createdAt) }}
              </template>
              <template v-else>—</template>
            </div>
            <div class="text-xs text-stone-500">
              <template v-if="selectedSession?.lastMovement">
                {{ getMethodLabel(selectedSession?.lastMovement?.paymentMethod || 'CASH') }}
                · {{ formatCurrency(selectedSession?.lastMovement?.amount) }}
              </template>
              <template v-else>Sin movimientos</template>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedBranchOpenSessions.length" class="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-sm font-semibold text-amber-900">Sesiones abiertas pendientes</div>
            <div class="text-xs text-amber-800">
              {{ selectedBranchOpenSessions.length }} caja(s) abierta(s) — revisá y cerrá las pendientes.
            </div>
          </div>
        </div>
        <div class="mt-3 space-y-2">
          <div
            v-for="session in selectedBranchOpenSessions"
            :key="session.id"
            class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-white px-3 py-2"
          >
            <div>
              <div class="text-sm font-medium text-stone-900">{{ session.cashBox?.name || 'Caja' }}</div>
              <div class="text-xs text-stone-500">
                Abierta: {{ formatDate(session.openingTime) }}
              </div>
              <div class="text-xs text-stone-500">
                Abrió: {{ session.openedByName || '—' }}
              </div>
            </div>
            <UButton size="xs" variant="outline" @click="() => openCloseModalFor(session.cashBoxId || '')">
              Cerrar caja
            </UButton>
          </div>
        </div>
      </div>

      <div v-if="isAdmin" class="rounded-lg border border-stone-200 bg-white shadow-sm">
        <div class="border-b border-stone-200 px-4 py-3 text-sm font-semibold text-stone-800">
          Sesiones abiertas (todas las sucursales)
        </div>
        <div v-if="isLoading" class="p-6">
          <USkeleton class="h-8 w-full" />
          <USkeleton class="mt-3 h-8 w-full" />
        </div>
        <div v-else-if="globalOpenSessionsSorted.length === 0" class="p-6">
          <CrudState
            :title="'Sin sesiones abiertas'"
            :description="'No hay sesiones abiertas en otras sucursales.'"
            icon="i-lucide-briefcase"
          />
        </div>
        <div v-else class="divide-y divide-stone-200">
          <div v-for="session in globalOpenSessionsSorted" :key="session.id" class="p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-stone-900">{{ session.branch?.name || 'Sucursal' }}</div>
                <div class="text-xs text-stone-500">Abrió: {{ session.openedByName || '—' }}</div>
                <div class="text-xs text-stone-500">Apertura: {{ formatDate(session.openingTime) }}</div>
              </div>
              <div class="text-right">
                <div class="text-sm text-stone-500">Balance actual</div>
                <div class="text-base font-semibold text-stone-900">{{ formatCurrency(getSessionCurrentBalance(session)) }}</div>
              </div>
              <div>
                <UButton
                  size="xs"
                  variant="outline"
                  :to="buildCloseUrl(session)"
                >
                  Ir a cerrar
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-stone-200 bg-white shadow-sm">
        <div class="border-b border-stone-200 px-4 py-3 text-sm font-semibold text-stone-800">
          Sectores por método de pago
        </div>
        <div v-if="isLoading" class="p-6">
          <USkeleton class="h-8 w-full" />
          <USkeleton class="mt-3 h-8 w-full" />
        </div>
        <div v-else-if="errorMessage" class="p-6">
          <CrudState
            :title="$t('admin.common.errorTitle')"
            :description="errorMessage"
            icon="i-lucide-alert-triangle"
            :action-label="$t('admin.common.retry')"
            @action="loadSessions"
          />
        </div>
        <div v-else-if="!selectedSession" class="p-6">
          <CrudState
            :title="'Sin sesión abierta'"
            :description="'Abrí la caja del día para habilitar sectores y movimientos.'"
            icon="i-lucide-briefcase"
          />
        </div>
        <div v-else-if="!hasActivePaymentMethods" class="p-6">
          <CrudState
            :title="'Sin métodos activos'"
            :description="'Activá al menos un método de pago en Configuración para ver los sectores.'"
            icon="i-lucide-alert-triangle"
          />
        </div>
        <div v-else class="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="method in sectorOrder"
            :key="method"
            class="rounded-lg border border-stone-200 bg-white p-4"
          >
            <div class="flex items-center justify-between">
              <div class="text-sm font-semibold text-stone-900">{{ getMethodLabel(method) }}</div>
              <UBadge variant="subtle" color="neutral" class="text-[10px]">{{ method }}</UBadge>
            </div>
            <div class="mt-2 text-xs text-stone-500">Subtotal</div>
            <div class="text-lg font-semibold text-stone-900">
              {{ formatCurrency(getTotalsByMethod(selectedSession)[method] || 0) }}
            </div>
            <div class="mt-2 text-xs text-stone-500">
              <span class="font-medium text-stone-600">Último movimiento:</span>
              <template v-if="selectedSession?.movements?.length">
                {{ formatDate(selectedSession?.movements?.find(m => m.paymentMethod === method)?.createdAt) || '—' }}
              </template>
              <template v-else>—</template>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <div class="text-sm font-medium text-stone-600">{{ $t('manager.cash.cashboxes') }}</div>
          <USelect
            v-model="selectedCashBoxId"
            :items="cashBoxes"
            value-key="id"
            label-key="name"
            :placeholder="$t('manager.cash.selectCashbox')"
          />
          <UButton color="primary" :disabled="!selectedBranchId || !!selectedSession" @click="openOpenModal">
            {{ $t('manager.cash.openSession') }}
          </UButton>
          <UButton variant="outline" :disabled="!selectedSession" @click="openCloseModal">
            {{ $t('manager.cash.closeSession') }}
          </UButton>
          <UButton variant="outline" :disabled="!selectedSession" @click="openMovementModal">
            {{ $t('manager.cash.movements') }}
          </UButton>
        </div>
      </div>

      <div class="rounded-lg border border-stone-200 bg-white shadow-sm">
        <div class="border-b border-stone-200 px-4 py-3 space-y-3">
          <div class="text-sm font-semibold text-stone-800 flex items-center justify-between">
            <span>{{ $t('manager.cash.sessions') }}</span>
            <span v-if="selectedSession" class="text-xs font-medium text-stone-500">
              Sesión activa
            </span>
          </div>
          <div class="flex flex-wrap items-end gap-2">
            <div class="text-xs text-stone-500">Filtrar por fecha:</div>
            <input v-model="sessionFrom" type="date" class="rounded border border-stone-300 px-2 py-1 text-xs" />
            <input v-model="sessionTo" type="date" class="rounded border border-stone-300 px-2 py-1 text-xs" />
            <UButton size="xs" variant="outline" @click="applySessionDateFilter">Aplicar</UButton>
            <UButton size="xs" variant="outline" @click="clearSessionDateFilter">Limpiar</UButton>
          </div>
        </div>
        <div v-if="isLoading" class="p-6">
          <USkeleton class="h-8 w-full" />
          <USkeleton class="mt-3 h-8 w-full" />
        </div>
        <div v-else-if="errorMessage" class="p-6">
          <CrudState
            :title="$t('admin.common.errorTitle')"
            :description="errorMessage"
            icon="i-lucide-alert-triangle"
            :action-label="$t('admin.common.retry')"
            @action="loadSessions"
          />
        </div>
        <div v-else-if="!sessionsForList.length" class="p-6">
          <CrudState
            :title="$t('manager.cash.emptySessions')"
            :description="$t('manager.cash.subtitle')"
            icon="i-lucide-briefcase"
          />
        </div>
        <div v-else class="divide-y divide-stone-200">
          <div v-for="session in sessionsForList" :key="session.id" class="p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-stone-900">{{ session.cashBox?.name || 'Caja del día' }}</div>
                <div class="text-xs text-stone-500">{{ formatDate(session.openingTime) }}</div>
              </div>
              <div class="text-right">
                <div class="text-sm text-stone-500">{{ $t('manager.cash.openingAmount') }}</div>
                <div class="text-base font-semibold text-stone-900">{{ formatCurrency(session.openingBalance) }}</div>
              </div>
              <div class="text-right">
                <div class="text-sm text-stone-500">Monto actual</div>
                <div class="text-base font-semibold text-stone-900">{{ formatCurrency(getSessionCurrentBalance(session)) }}</div>
              </div>
              <div class="text-right">
                <div class="text-sm text-stone-500">{{ $t('manager.cash.closingAmount') }}</div>
                <div class="text-base font-semibold text-stone-900">{{ formatCurrency(session.closingBalance) }}</div>
              </div>
            </div>
            <div class="mt-3 text-xs text-stone-500">
              {{ session.closingTime ? formatDate(session.closingTime) : t('manager.cash.openSession') }}
            </div>
            <div class="mt-3">
              <UButton
                v-if="!session.closingTime"
                size="xs"
                variant="outline"
                @click="() => openCloseModalFor(session.cashBoxId || '')"
              >
                {{ $t('manager.cash.closeSession') }}
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedSession" class="rounded-lg border border-stone-200 bg-white shadow-sm">
        <div class="border-b border-stone-200 px-4 py-3 text-sm font-semibold text-stone-800">
          {{ $t('manager.cash.movements') }}
        </div>
        <div v-if="!selectedSession.movements.length" class="p-6">
          <CrudState
            :title="$t('manager.cash.emptyMovements')"
            :description="$t('manager.cash.subtitle')"
            icon="i-lucide-list" 
          />
        </div>
        <div v-else class="divide-y divide-stone-200">
          <div v-for="movement in selectedSession.movements" :key="movement.id" class="p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm font-medium text-stone-900">
                  {{ movement.type === 'DEPOSIT' ? $t('manager.cash.deposit') : $t('manager.cash.withdrawal') }}
                </div>
                <div class="text-xs text-stone-500">
                  {{ formatDate(movement.createdAt) }} · {{ getMethodLabel(movement.paymentMethod || 'CASH') }}
                </div>
              </div>
              <div class="text-right text-sm font-semibold text-stone-900">
                {{ formatCurrency(movement.amount) }}
              </div>
            </div>
            <div v-if="movement.reason" class="mt-2 text-xs text-stone-600">{{ movement.reason }}</div>
          </div>
        </div>
      </div>
    </section>

  </div>

  <UModal v-model:open="openingModal" :title="$t('manager.cash.openSession')" :ui="{ footer: 'justify-end' }">
    <template #body>
      <UForm ref="openFormRef" :schema="openSchema" :state="openForm" class="space-y-4" @submit="submitOpen">
        <UFormField :label="$t('manager.cash.cashboxes')" name="cashBoxId">
          <USelect v-model="openForm.cashBoxId" :items="cashBoxes" value-key="id" label-key="name" />
        </UFormField>
        <UFormField :label="$t('manager.cash.openingAmount')" name="openingAmount">
          <UInputNumber v-model="openForm.openingAmount" :min="0" />
        </UFormField>
        <div class="hidden">
          <UButton type="submit" />
        </div>
      </UForm>
    </template>
    <template #footer>
      <UButton color="neutral" variant="outline" @click="openingModal = false">{{ $t('common.cancel') }}</UButton>
      <UButton color="primary" :loading="isSaving" @click="openFormRef?.submit()">
        {{ $t('common.confirm') }}
      </UButton>
    </template>
  </UModal>

  <UModal v-model:open="closingModal" :title="$t('manager.cash.closeSession')" :ui="{ footer: 'justify-end' }">
    <template #body>
      <UForm ref="closeFormRef" :schema="closeSchema" :state="closeForm" class="space-y-4" @submit="submitClose">
        <UFormField :label="$t('manager.cash.closingAmount')" name="countedCash">
          <UInputNumber v-model="closeForm.countedCash" :min="0" />
        </UFormField>
        <UFormField :label="$t('manager.cash.closingCard')" name="countedCard">
          <UInputNumber v-model="closeForm.countedCard" :min="0" />
        </UFormField>
        <UFormField :label="$t('manager.cash.closingTransfer')" name="countedTransfer">
          <UInputNumber v-model="closeForm.countedTransfer" :min="0" />
        </UFormField>
        <UFormField :label="$t('manager.cash.closingOther')" name="countedOther">
          <UInputNumber v-model="closeForm.countedOther" :min="0" />
        </UFormField>
        <div class="hidden">
          <UButton type="submit" />
        </div>
      </UForm>
    </template>
    <template #footer>
      <UButton color="neutral" variant="outline" @click="closingModal = false">{{ $t('common.cancel') }}</UButton>
      <UButton color="primary" :loading="isSaving" @click="closeFormRef?.submit()">
        {{ $t('common.confirm') }}
      </UButton>
    </template>
  </UModal>

  <UModal v-model:open="movementModal" :title="$t('manager.cash.movements')" :ui="{ footer: 'justify-end' }">
    <template #body>
      <UForm ref="movementFormRef" :schema="movementSchema" :state="movementForm" class="space-y-4" @submit="submitMovement">
        <UFormField :label="$t('manager.cash.movementType')" name="type">
          <USelect v-model="movementForm.type" :items="movementItems" value-key="value" />
        </UFormField>
        <UFormField :label="$t('manager.cash.movementMethod')" name="paymentMethod">
          <USelect v-model="movementForm.paymentMethod" :items="paymentMethodItems" value-key="value" />
        </UFormField>
        <UFormField label="Medio" name="paymentMediumId">
          <USelect v-model="movementForm.paymentMediumId" :items="paymentMediumItems" value-key="value" />
        </UFormField>
        <UFormField :label="$t('manager.cash.movementAmount')" name="amount">
          <UInputNumber v-model="movementForm.amount" :min="0" />
        </UFormField>
        <UFormField :label="$t('manager.cash.movementReason')" name="reason">
          <UInput v-model="movementForm.reason" />
        </UFormField>
        <div class="hidden">
          <UButton type="submit" />
        </div>
      </UForm>
    </template>
    <template #footer>
      <UButton color="neutral" variant="outline" @click="movementModal = false">{{ $t('common.cancel') }}</UButton>
      <UButton color="primary" :loading="isSaving" @click="movementFormRef?.submit()">
        {{ $t('common.confirm') }}
      </UButton>
    </template>
  </UModal>
</template>
