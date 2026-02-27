<script setup lang="ts">
import { useSelectedBranch } from '~/composables/useSelectedBranch'
import { loadMe, useMeState } from '~/composables/useMe'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN'],
})

type CashBox = {
  id: string
  name: string
  active: boolean
  branch: { id: string; name: string }
}

const me = useMeState()

const { selectedBranchId, branchOptions, refresh: refreshBranches } = useSelectedBranch()

// CashBoxes should be manageable across branches without changing the global branch context
const cashBoxBranchId = ref('')

const cashBoxes = ref<CashBox[]>([])
const paymentMethods = ref<{ method: string; label: string; active: boolean }[]>([])
const paymentMedia = ref<{ id: string; method: string; name: string; description?: string | null; active: boolean; isSystem: boolean }[]>([])
const customPaymentMedia = computed(() => paymentMedia.value.filter(item => !item.isSystem))
const paymentMethodsLoading = ref(false)
const paymentMethodsError = ref('')
const paymentMediaSaving = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

type EmailStatus = {
  provider: string | null
  from: string | null
  replyTo: string | null
  providerActive: boolean
  fromConfigured: boolean
  replyToConfigured: boolean
  apiKeyConfigured: boolean
  dryRun: boolean
  confirmation: {
    enabled: boolean
    configurable: boolean
    note?: string
  }
}

const emailStatus = ref<EmailStatus | null>(null)
const emailStatusLoading = ref(false)
const emailStatusError = ref('')
const emailTestLoading = ref(false)
const emailTestMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const emailTestTarget = ref('')

type Branch = {
  id: string
  name: string
  address?: string | null
  phone?: string | null
}

const branches = ref<Branch[]>([])
const branchForm = reactive({
  name: '',
  address: '',
  phone: ''
})

const branchEditOpen = ref(false)
const branchDeleteOpen = ref(false)
const selectedBranch = ref<Branch | null>(null)

const canManageBranches = computed(() => me.value?.role === 'OWNER' || me.value?.role === 'ADMIN')

const formState = reactive({
  name: '',
  active: true
})

const paymentMediumForm = reactive({
  method: 'CARD',
  name: '',
  description: ''
})

const groupedCashBoxes = computed(() => {
  const map = new Map<string, { branchId: string; branchName: string; items: CashBox[] }>()
  for (const cb of cashBoxes.value) {
    const branchId = cb.branch?.id || ''
    const branchName = cb.branch?.name || ''
    const key = branchId || branchName || 'unknown'

    if (!map.has(key)) {
      map.set(key, { branchId, branchName, items: [] })
    }
    map.get(key)!.items.push(cb)
  }

  const groups = Array.from(map.values())
  groups.sort((a, b) => a.branchName.localeCompare(b.branchName))
  for (const g of groups) g.items.sort((a, b) => a.name.localeCompare(b.name))
  return groups
})

watchEffect(() => {
  // initialize once branch options load
  if (!cashBoxBranchId.value && selectedBranchId.value) {
    cashBoxBranchId.value = selectedBranchId.value
  }
})

async function loadCashBoxes() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    cashBoxes.value = await $fetch('/api/cashboxes')
  } catch (e: any) {
    cashBoxes.value = []
    errorMessage.value = e?.data?.statusMessage || 'No se pudo cargar'
  } finally {
    isLoading.value = false
  }
}

async function loadPaymentMethods() {
  paymentMethodsLoading.value = true
  paymentMethodsError.value = ''
  try {
    const response = await $fetch('/api/settings/payment-methods')
    const methods = response?.methods || []
    const media = response?.media || []
    const labelMap: Record<string, string> = {
      CASH: $t('manager.cash.methodCash'),
      CARD: $t('manager.cash.methodCard'),
      TRANSFER: $t('manager.cash.methodTransfer'),
      OTHER: $t('manager.cash.methodOther')
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
        description: item.description,
        active: item.active,
        isSystem: item.isSystem
      }))
      .sort((a, b) => defaultOrder.indexOf(a.method) - defaultOrder.indexOf(b.method))
  } catch (e: any) {
    paymentMethods.value = []
    paymentMethodsError.value = e?.data?.statusMessage || 'No se pudo cargar'
  } finally {
    paymentMethodsLoading.value = false
  }
}

async function togglePaymentMethod(method: { method: string; active: boolean }) {
  paymentMethodsLoading.value = true
  paymentMethodsError.value = ''
  try {
    await $fetch('/api/settings/payment-methods', {
      method: 'PATCH',
      body: {
        method: method.method,
        active: !method.active
      }
    })
    await loadPaymentMethods()
  } catch (e: any) {
    paymentMethodsError.value = e?.data?.statusMessage || 'No se pudo actualizar'
  } finally {
    paymentMethodsLoading.value = false
  }
}

async function createPaymentMedium() {
  if (!paymentMediumForm.name.trim()) return
  paymentMediaSaving.value = true
  paymentMethodsError.value = ''
  try {
    await $fetch('/api/settings/payment-methods', {
      method: 'POST',
      body: {
        method: paymentMediumForm.method,
        name: paymentMediumForm.name.trim(),
        description: paymentMediumForm.description.trim() || null,
        active: true
      }
    })
    paymentMediumForm.name = ''
    paymentMediumForm.description = ''
    await loadPaymentMethods()
  } catch (e: any) {
    paymentMethodsError.value = e?.data?.statusMessage || 'No se pudo crear el medio'
  } finally {
    paymentMediaSaving.value = false
  }
}

async function togglePaymentMedium(item: { id: string; active: boolean }) {
  paymentMediaSaving.value = true
  paymentMethodsError.value = ''
  try {
    await $fetch('/api/settings/payment-methods', {
      method: 'PATCH',
      body: {
        id: item.id,
        active: !item.active
      }
    })
    await loadPaymentMethods()
  } catch (e: any) {
    paymentMethodsError.value = e?.data?.statusMessage || 'No se pudo actualizar el medio'
  } finally {
    paymentMediaSaving.value = false
  }
}

async function loadBranches() {
  errorMessage.value = ''
  try {
    branches.value = await $fetch('/api/public/branches')
  } catch (e: any) {
    branches.value = []
    errorMessage.value = e?.data?.statusMessage || 'No se pudo cargar'
  }
}

async function handleCreateBranch() {
  if (!canManageBranches.value || !branchForm.name.trim()) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    await $fetch('/api/branches', {
      method: 'POST',
      body: {
        name: branchForm.name.trim(),
        address: branchForm.address?.trim() || null,
        phone: branchForm.phone?.trim() || null
      }
    })

    branchForm.name = ''
    branchForm.address = ''
    branchForm.phone = ''

    await refreshBranches()
    await loadBranches()
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage || 'No se pudo crear'
  } finally {
    isLoading.value = false
  }
}

function openEditBranch(branch: Branch) {
  selectedBranch.value = branch
  branchForm.name = branch.name
  branchForm.address = branch.address || ''
  branchForm.phone = branch.phone || ''
  branchEditOpen.value = true
}

function openDeleteBranch(branch: Branch) {
  selectedBranch.value = branch
  branchDeleteOpen.value = true
}

async function handleUpdateBranch() {
  if (!canManageBranches.value || !selectedBranch.value) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    await $fetch(`/api/branches/${selectedBranch.value.id}`, {
      method: 'PATCH',
      body: {
        name: branchForm.name.trim(),
        address: branchForm.address?.trim() || null,
        phone: branchForm.phone?.trim() || null
      }
    })

    branchEditOpen.value = false
    selectedBranch.value = null
    branchForm.name = ''
    branchForm.address = ''
    branchForm.phone = ''

    await refreshBranches()
    await loadBranches()
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage || 'No se pudo actualizar'
  } finally {
    isLoading.value = false
  }
}

async function handleDeleteBranch() {
  if (!canManageBranches.value || !selectedBranch.value) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    await $fetch(`/api/branches/${selectedBranch.value.id}`, { method: 'DELETE' })

    branchDeleteOpen.value = false
    selectedBranch.value = null

    await refreshBranches()
    await loadBranches()
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage || 'No se pudo eliminar'
  } finally {
    isLoading.value = false
  }
}

async function handleCreateCashBox() {
  if (!cashBoxBranchId.value || !formState.name.trim()) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    await $fetch('/api/cashboxes', {
      method: 'POST',
      body: {
        branchId: cashBoxBranchId.value,
        name: formState.name.trim(),
        active: formState.active
      }
    })
    formState.name = ''
    formState.active = true
    await loadCashBoxes()
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage || 'No se pudo crear'
  } finally {
    isLoading.value = false
  }
}

async function toggleCashBox(cb: CashBox) {
  isLoading.value = true
  errorMessage.value = ''
  try {
    await $fetch(`/api/cashboxes/${cb.id}`, {
      method: 'PATCH',
      body: { active: !cb.active }
    })
    await loadCashBoxes()
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage || 'No se pudo actualizar'
  } finally {
    isLoading.value = false
  }
}

async function loadEmailStatus() {
  emailStatusLoading.value = true
  emailStatusError.value = ''
  try {
    emailStatus.value = await $fetch('/api/settings/email')
  } catch (e: any) {
    emailStatus.value = null
    emailStatusError.value = e?.data?.statusMessage || 'No se pudo cargar'
  } finally {
    emailStatusLoading.value = false
  }
}

async function sendTestEmail() {
  const target = emailTestTarget.value.trim()
  if (!target) return
  emailTestLoading.value = true
  emailTestMessage.value = null
  try {
    const response = await $fetch('/api/settings/email-test', {
      method: 'POST',
      body: { to: target }
    })
    if (response?.ok) {
      emailTestMessage.value = { type: 'success', text: 'Email de prueba enviado.' }
    } else {
      emailTestMessage.value = { type: 'error', text: response?.error || 'No se pudo enviar.' }
    }
  } catch (e: any) {
    emailTestMessage.value = { type: 'error', text: e?.data?.statusMessage || 'No se pudo enviar.' }
  } finally {
    emailTestLoading.value = false
  }
}

onMounted(() => {
  void loadMe()
  void loadBranches()
  void loadCashBoxes()
  void loadPaymentMethods()
  void loadEmailStatus()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">{{ $t('pages.private.managerSettings') }}</h1>
      <p class="text-sm text-gray-600">{{ $t('pages.private.manager.cashboxes.subtitle') }}</p>
    </div>

    <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-sm font-semibold text-gray-900">{{ $t('nav.branches') }}</div>
          <div class="text-xs text-gray-500">
            {{ canManageBranches ? $t('admin.branches.emptyDescription') : '' }}
          </div>
        </div>
      </div>

      <div v-if="canManageBranches" class="mt-3 grid gap-3 sm:grid-cols-3">
        <input
          v-model="branchForm.name"
          type="text"
          class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          :placeholder="$t('admin.branches.form.name')"
        />
        <input
          v-model="branchForm.address"
          type="text"
          class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          :placeholder="$t('admin.branches.form.address')"
        />
        <div class="flex gap-2">
          <input
            v-model="branchForm.phone"
            type="text"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            :placeholder="$t('admin.branches.form.phone')"
          />
          <UButton color="primary" :disabled="!branchForm.name.trim()" :loading="isLoading" @click="handleCreateBranch">
            {{ $t('admin.branches.new') }}
          </UButton>
        </div>
      </div>

      <div class="mt-4 space-y-2">
        <div v-if="!branches.length" class="text-sm text-gray-600">{{ $t('admin.branches.emptyTitle') }}</div>
        <div v-else>
          <div v-for="b in branches" :key="b.id" class="flex items-center justify-between rounded border border-gray-200 px-3 py-2">
            <div>
              <div class="text-sm font-medium text-gray-900">{{ b.name }}</div>
              <div class="text-xs text-gray-500">{{ [b.address, b.phone].filter(Boolean).join(' · ') }}</div>
            </div>

            <div v-if="canManageBranches" class="flex items-center gap-2">
              <UButton size="sm" variant="outline" @click="openEditBranch(b)">
                {{ $t('admin.common.edit') }}
              </UButton>
              <UButton size="sm" color="error" variant="outline" @click="openDeleteBranch(b)">
                {{ $t('admin.common.delete') }}
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-sm font-semibold text-gray-900">{{ $t('pages.private.manager.paymentMethods.title') }}</div>
          <div class="text-xs text-gray-500">{{ $t('pages.private.manager.paymentMethods.subtitle') }}</div>
        </div>
      </div>

      <div v-if="paymentMethodsLoading" class="mt-2 text-xs text-gray-500">{{ $t('common.loading') }}</div>
      <div v-if="paymentMethodsError" class="mt-2 text-xs text-red-600">{{ paymentMethodsError }}</div>

      <div v-if="!paymentMethods.length" class="mt-3 text-sm text-gray-600">{{ $t('pages.private.manager.paymentMethods.empty') }}</div>
      <div v-else class="mt-3 space-y-2">
        <div v-for="method in paymentMethods" :key="method.method" class="flex items-center justify-between rounded border border-gray-200 px-3 py-2">
          <div class="text-sm font-medium text-gray-900">{{ method.label }}</div>
          <div class="text-xs text-gray-500">
            {{ method.active ? $t('pages.private.manager.paymentMethods.active') : $t('pages.private.manager.paymentMethods.inactive') }}
          </div>
          <UButton
            size="xs"
            variant="outline"
            :loading="paymentMethodsLoading"
            @click="togglePaymentMethod(method)"
          >
            {{ method.active ? $t('pages.private.manager.paymentMethods.deactivate') : $t('pages.private.manager.paymentMethods.activate') }}
          </UButton>
        </div>
      </div>

      <div class="mt-5 border-t border-gray-200 pt-4">
        <div class="text-sm font-semibold text-gray-900">{{ $t('pages.private.manager.paymentMethods.mediaTitle') }}</div>
        <div class="mt-2 grid gap-2 md:grid-cols-4">
          <select v-model="paymentMediumForm.method" class="rounded border border-gray-300 px-3 py-2 text-sm">
            <option value="CASH">{{ $t('manager.cash.methodCash') }}</option>
            <option value="CARD">{{ $t('manager.cash.methodCard') }}</option>
            <option value="TRANSFER">{{ $t('manager.cash.methodTransfer') }}</option>
            <option value="OTHER">{{ $t('manager.cash.methodOther') }}</option>
          </select>
          <input v-model="paymentMediumForm.name" type="text" class="rounded border border-gray-300 px-3 py-2 text-sm" :placeholder="$t('pages.private.manager.paymentMethods.mediaNamePlaceholder')" />
          <input v-model="paymentMediumForm.description" type="text" class="rounded border border-gray-300 px-3 py-2 text-sm" :placeholder="$t('pages.private.manager.paymentMethods.mediaDescPlaceholder')" />
          <UButton color="primary" :loading="paymentMediaSaving" :disabled="!paymentMediumForm.name.trim()" @click="createPaymentMedium">
            {{ $t('pages.private.manager.paymentMethods.mediaCreate') }}
          </UButton>
        </div>

        <div v-if="!customPaymentMedia.length" class="mt-3 text-sm text-gray-600">{{ $t('pages.private.manager.paymentMethods.customEmpty') }}</div>
        <div class="mt-3 space-y-2" v-else>
          <div v-for="item in customPaymentMedia" :key="item.id" class="flex items-center justify-between rounded border border-gray-200 px-3 py-2">
            <div>
              <div class="text-sm font-medium text-gray-900">{{ item.name }} <span class="text-xs text-gray-500">({{ item.method }})</span></div>
              <div class="text-xs text-gray-500">{{ item.description || '—' }}</div>
            </div>
            <UButton size="xs" variant="outline" :loading="paymentMediaSaving" @click="togglePaymentMedium(item)">
              {{ item.active ? $t('pages.private.manager.paymentMethods.deactivate') : $t('pages.private.manager.paymentMethods.activate') }}
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-sm font-semibold text-gray-900">Email / Confirmaciones</div>
          <div class="text-xs text-gray-500">Visibilidad segura de configuración y prueba de envío.</div>
        </div>
      </div>

      <div v-if="emailStatusLoading" class="mt-2 text-xs text-gray-500">{{ $t('common.loading') }}</div>
      <div v-if="emailStatusError" class="mt-2 text-xs text-red-600">{{ emailStatusError }}</div>

      <div v-if="emailStatus" class="mt-3 grid gap-3 sm:grid-cols-2">
        <div class="rounded border border-gray-200 px-3 py-2">
          <div class="text-xs text-gray-500">Proveedor activo</div>
          <div class="text-sm font-medium text-gray-900">
            {{ emailStatus.providerActive ? (emailStatus.provider || 'Activo') : 'No configurado' }}
          </div>
        </div>
        <div class="rounded border border-gray-200 px-3 py-2">
          <div class="text-xs text-gray-500">From</div>
          <div class="text-sm font-medium text-gray-900">{{ emailStatus.from || '—' }}</div>
        </div>
        <div class="rounded border border-gray-200 px-3 py-2">
          <div class="text-xs text-gray-500">Reply-To</div>
          <div class="text-sm font-medium text-gray-900">{{ emailStatus.replyTo || '—' }}</div>
        </div>
        <div class="rounded border border-gray-200 px-3 py-2">
          <div class="text-xs text-gray-500">Confirmaciones</div>
          <div class="text-sm font-medium text-gray-900">
            {{ emailStatus.confirmation.enabled ? 'Habilitadas' : 'Deshabilitadas' }}
          </div>
          <div v-if="emailStatus.confirmation.note" class="text-xs text-gray-500">
            {{ emailStatus.confirmation.note }}
          </div>
        </div>
      </div>

      <div class="mt-4 border-t border-gray-200 pt-4">
        <div class="text-sm font-semibold text-gray-900">Enviar email de prueba</div>
        <div class="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            v-model="emailTestTarget"
            type="email"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="correo@dominio.com"
          />
          <UButton color="primary" :disabled="!emailTestTarget.trim()" :loading="emailTestLoading" @click="sendTestEmail">
            Enviar email de prueba
          </UButton>
        </div>
        <div v-if="emailTestMessage" class="mt-2 text-xs" :class="emailTestMessage.type === 'success' ? 'text-green-700' : 'text-red-600'">
          {{ emailTestMessage.text }}
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-sm font-semibold text-gray-900">{{ $t('pages.private.manager.cashboxes.newTitle') }}</div>
          <div class="text-xs text-gray-500">{{ $t('pages.private.manager.cashboxes.subtitle') }}</div>
        </div>

        <div class="flex items-center gap-2">
          <input
            v-model="formState.name"
            type="text"
            class="w-56 rounded border border-gray-300 px-3 py-2 text-sm"
            :placeholder="$t('pages.private.manager.cashboxes.namePlaceholder')"
          />

          <select v-model="cashBoxBranchId" class="w-56 rounded border border-gray-300 px-3 py-2 text-sm">
            <option value="" disabled>{{ $t('pages.private.manager.cashboxes.selectBranch') }}</option>
            <option v-for="branch in branchOptions" :key="branch.id" :value="branch.id">
              {{ branch.name }}
            </option>
          </select>

          <UButton color="primary" :disabled="!formState.name.trim() || !cashBoxBranchId" @click="handleCreateCashBox">
            {{ $t('pages.private.manager.cashboxes.create') }}
          </UButton>
        </div>
      </div>

      <div v-if="isLoading" class="mt-2 text-xs text-gray-500">{{ $t('common.loading') }}</div>
      <div v-if="errorMessage" class="mt-2 text-xs text-red-600">{{ errorMessage }}</div>

      <div class="mt-6 flex items-start justify-between gap-3">
        <div>
          <div class="text-sm font-semibold text-gray-900">{{ $t('pages.private.manager.cashboxes.listTitle') }}</div>
          <div class="text-xs text-gray-500">{{ $t('pages.private.manager.cashboxes.branch') }}: {{ $t('common.all') || 'Todas' }}</div>
        </div>
      </div>

      <div v-if="!cashBoxes.length" class="mt-3 text-sm text-gray-600">{{ $t('pages.private.manager.cashboxes.empty') }}</div>
      <div v-else class="mt-3 space-y-4">
        <div v-for="group in groupedCashBoxes" :key="group.branchId || group.branchName" class="rounded border border-gray-200">
          <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2">
            <div class="text-sm font-semibold text-gray-900">{{ group.branchName || 'Sucursal' }}</div>
            <div class="text-xs text-gray-500">{{ group.items.length }}</div>
          </div>

          <div class="divide-y divide-gray-200">
            <div v-for="cb in group.items" :key="cb.id" class="flex items-center justify-between px-3 py-2">
              <div>
                <div class="text-sm font-medium text-gray-900">{{ cb.name }}</div>
                <div class="text-xs text-gray-500">{{ cb.active ? $t('pages.private.manager.cashboxes.activeState') : $t('pages.private.manager.cashboxes.inactiveState') }}</div>
              </div>
              <UButton variant="outline" size="sm" @click="toggleCashBox(cb)">
                {{ cb.active ? $t('pages.private.manager.cashboxes.deactivate') : $t('pages.private.manager.cashboxes.activate') }}
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <UModal v-model:open="branchEditOpen" :title="$t('admin.branches.editTitle')" :ui="{ footer: 'justify-end' }">
    <template #body>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium">{{ $t('admin.branches.form.name') }}</label>
          <input v-model="branchForm.name" type="text" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-sm font-medium">{{ $t('admin.branches.form.address') }}</label>
          <input v-model="branchForm.address" type="text" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-sm font-medium">{{ $t('admin.branches.form.phone') }}</label>
          <input v-model="branchForm.phone" type="text" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>
    </template>
    <template #footer>
      <UButton color="neutral" variant="outline" @click="branchEditOpen = false">{{ $t('common.cancel') }}</UButton>
      <UButton color="primary" :loading="isLoading" :disabled="!branchForm.name.trim()" @click="handleUpdateBranch">{{ $t('admin.common.save') }}</UButton>
    </template>
  </UModal>

  <UModal v-model:open="branchDeleteOpen" :title="$t('admin.branches.deleteTitle')" :ui="{ footer: 'justify-end' }">
    <template #body>
      <p class="text-sm text-stone-600">{{ $t('admin.branches.deleteConfirm', { name: selectedBranch?.name || '' }) }}</p>
    </template>
    <template #footer>
      <UButton color="neutral" variant="outline" @click="branchDeleteOpen = false">{{ $t('common.cancel') }}</UButton>
      <UButton color="error" :loading="isLoading" @click="handleDeleteBranch">{{ $t('admin.common.delete') }}</UButton>
    </template>
  </UModal>
</template>
