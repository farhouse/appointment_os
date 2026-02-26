<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useSelectedBranch } from '~/composables/useSelectedBranch'

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
  cashBoxId: string
  openingBalance: string
  closingBalance?: string | null
  openingTime: string
  closingTime?: string | null
  openedByName?: string | null
  cashBox: CashBox
  movements: CashMovement[]
}

type CashMovement = {
  id: string
  amount: string
  type: 'DEPOSIT' | 'WITHDRAWAL'
  reason?: string | null
  createdAt: string
}

const { t } = useI18n()
const { selectedBranchId } = useSelectedBranch()
const toast = useToast()

const cashBoxes = ref<CashBox[]>([])
const sessions = ref<CashSession[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const selectedCashBoxId = ref('')
const selectedSession = computed(() => sessions.value.find(s => s.cashBoxId === selectedCashBoxId.value && !s.closingTime) || null)

const openSessions = computed(() => sessions.value.filter(s => !s.closingTime))


const openSchema = z.object({
  cashBoxId: z.string().min(1),
  openingAmount: z.number().min(0)
})

const closeSchema = z.object({
  countedCash: z.number().min(0)
})

const movementSchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
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
  countedCash: 0
})

const movementForm = reactive<Partial<MovementForm>>({
  type: 'DEPOSIT',
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

const movementItems = computed(() => [
  { label: t('manager.cash.deposit'), value: 'DEPOSIT' },
  { label: t('manager.cash.withdrawal'), value: 'WITHDRAWAL' }
])

watch(selectedBranchId, () => {
  if (!selectedBranchId.value) return
  selectedCashBoxId.value = ''
  void loadCashboxes()
  void loadSessions()
})

watch(selectedCashBoxId, (value) => {
  openForm.cashBoxId = value
})

async function loadCashboxes() {
  if (!selectedBranchId.value) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    const query = new URLSearchParams({ branchId: selectedBranchId.value })
    cashBoxes.value = await $fetch(`/api/cashboxes?${query.toString()}`)
  } catch (e: any) {
    cashBoxes.value = []
    errorMessage.value = e?.data?.statusMessage || t('admin.common.loadError')
  } finally {
    isLoading.value = false
  }
}

async function loadSessions() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const query = new URLSearchParams()
    if (selectedBranchId.value) query.set('branchId', selectedBranchId.value)
    sessions.value = await $fetch(`/api/cash/sessions?${query.toString()}`)
  } catch (e: any) {
    sessions.value = []
    errorMessage.value = e?.data?.statusMessage || t('admin.common.loadError')
  } finally {
    isLoading.value = false
  }
}

function openOpenModal() {
  openForm.openingAmount = 0
  openForm.cashBoxId = selectedCashBoxId.value
  openingModal.value = true
}

function openCloseModal() {
  closeForm.countedCash = 0
  closingModal.value = true
}

function openMovementModal() {
  movementForm.type = 'DEPOSIT'
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
        cashBoxId: event.data.cashBoxId,
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
  isSaving.value = true
  try {
    await $fetch('/api/cash/movements', {
      method: 'POST',
      body: {
        sessionId: selectedSession.value.id,
        amount: event.data.amount,
        type: event.data.type,
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

function getSessionCurrentBalance(session: CashSession | null) {
  if (!session) return null
  // If session is closed and closingBalance exists, prefer that.
  if (session.closingTime && session.closingBalance != null) return toNumber(session.closingBalance)

  const opening = toNumber(session.openingBalance)
  const deposits = (session.movements || [])
    .filter(m => m.type === 'DEPOSIT')
    .reduce((acc, m) => acc + toNumber(m.amount), 0)
  const withdrawals = (session.movements || [])
    .filter(m => m.type === 'WITHDRAWAL')
    .reduce((acc, m) => acc + toNumber(m.amount), 0)

  return opening + deposits - withdrawals
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
  if (selectedBranchId.value) {
    void loadCashboxes()
    void loadSessions()
  }
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">{{ $t('pages.private.managerCash') }}</h1>
      <p class="text-sm text-gray-600">{{ $t('manager.cash.subtitle') }}</p>
    </div>

    <div class="rounded-lg border border-stone-200 bg-white shadow-sm">
      <div class="border-b border-stone-200 px-4 py-3 text-sm font-semibold text-stone-800">
        Estado por caja
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
      <div v-else-if="!cashBoxes.length" class="p-6">
        <CrudState
          :title="$t('manager.cash.emptySessions')"
          :description="$t('manager.cash.subtitle')"
          icon="i-lucide-briefcase"
        />
      </div>
      <div v-else class="divide-y divide-stone-200">
        <div v-for="box in cashBoxes" :key="box.id" class="p-4">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <div class="text-sm font-semibold text-stone-900">{{ box.name }}</div>
                <UBadge
                  :color="getCashBoxOpenSession(box.id) ? 'success' : 'neutral'"
                  variant="subtle"
                  class="text-[10px]"
                >
                  {{ getCashBoxOpenSession(box.id) ? 'OPEN' : 'CLOSED' }}
                </UBadge>
              </div>
              <div class="mt-1 text-xs text-stone-500">
                <span class="font-medium text-stone-600">Apertura:</span>
                {{ formatDate(getCashBoxOpenSession(box.id)?.openingTime) }}
              </div>
              <div class="text-xs text-stone-500">
                <span class="font-medium text-stone-600">Abrió:</span>
                {{ getCashBoxOpenSession(box.id)?.openedByName || '—' }}
              </div>
            </div>

            <div class="text-right">
              <div class="text-sm text-stone-500">Monto actual</div>
              <div class="text-base font-semibold text-stone-900">
                {{ formatCurrency(getCashBoxCurrentBalance(box.id)) }}
              </div>
              <div class="text-xs text-stone-500">
                <template v-if="getCashBoxOpenSession(box.id)">Sesión abierta</template>
                <template v-else>Sin sesión abierta</template>
              </div>
            </div>

            <div class="text-right">
              <div class="text-sm text-stone-500">Último movimiento</div>
              <div class="text-sm font-medium text-stone-900">
                <template v-if="getCashBoxLastMovement(box.id)">
                  {{ formatDate(getCashBoxLastMovement(box.id)?.createdAt) }}
                </template>
                <template v-else>—</template>
              </div>
              <div class="text-xs text-stone-500">
                <template v-if="getCashBoxLastMovement(box.id)">
                  {{ getCashBoxLastMovement(box.id)?.type === 'DEPOSIT' ? $t('manager.cash.deposit') : $t('manager.cash.withdrawal') }}
                  · {{ formatCurrency(getCashBoxLastMovement(box.id)?.amount) }}
                </template>
                <template v-else>Sin movimientos</template>
              </div>
            </div>
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
        <UButton color="primary" :disabled="!selectedCashBoxId" @click="openOpenModal">
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
      <div class="border-b border-stone-200 px-4 py-3 text-sm font-semibold text-stone-800 flex items-center justify-between">
        <span>{{ $t('manager.cash.sessions') }}</span>
        <span v-if="openSessions.length" class="text-xs font-medium text-stone-500">
          {{ openSessions.length }} caja(s) abierta(s)
        </span>
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
      <div v-else-if="!sessions.length" class="p-6">
        <CrudState
          :title="$t('manager.cash.emptySessions')"
          :description="$t('manager.cash.subtitle')"
          icon="i-lucide-briefcase"
        />
      </div>
      <div v-else class="divide-y divide-stone-200">
        <div v-for="session in sessions" :key="session.id" class="p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div class="text-sm font-semibold text-stone-900">{{ session.cashBox?.name }}</div>
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
              @click="() => { selectedCashBoxId = session.cashBoxId; openCloseModal() }"
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
              <div class="text-xs text-stone-500">{{ formatDate(movement.createdAt) }}</div>
            </div>
            <div class="text-right text-sm font-semibold text-stone-900">
              {{ formatCurrency(movement.amount) }}
            </div>
          </div>
          <div v-if="movement.reason" class="mt-2 text-xs text-stone-600">{{ movement.reason }}</div>
        </div>
      </div>
    </div>
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
