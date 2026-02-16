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
}

const me = useMeState()

const { selectedBranchId, branchOptions, refresh: refreshBranches } = useSelectedBranch()

const cashBoxes = ref<CashBox[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

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

const canLoadCashBoxes = computed(() => !!selectedBranchId.value)

watch(selectedBranchId, () => {
  if (!canLoadCashBoxes.value) return
  void loadCashBoxes()
})

async function loadCashBoxes() {
  if (!selectedBranchId.value) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    const query = new URLSearchParams({ branchId: selectedBranchId.value })
    cashBoxes.value = await $fetch(`/api/cashboxes?${query.toString()}`)
  } catch (e: any) {
    cashBoxes.value = []
    errorMessage.value = e?.data?.statusMessage || 'No se pudo cargar'
  } finally {
    isLoading.value = false
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
  if (!selectedBranchId.value || !formState.name.trim()) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    await $fetch('/api/cashboxes', {
      method: 'POST',
      body: {
        branchId: selectedBranchId.value,
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

onMounted(() => {
  void loadMe()
  void loadBranches()
  if (canLoadCashBoxes.value) void loadCashBoxes()
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
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-sm font-semibold text-gray-900">{{ $t('pages.private.manager.cashboxes.newTitle') }}</div>
          <div class="text-xs text-gray-500">{{ $t('pages.private.manager.cashboxes.subtitle') }}</div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <label class="text-sm font-medium">{{ $t('pages.private.manager.cashboxes.branch') }}</label>
          <select v-model="selectedBranchId" class="rounded border border-gray-300 px-3 py-2 text-sm">
            <option value="" disabled>{{ $t('pages.private.manager.cashboxes.selectBranch') }}</option>
            <option v-for="branch in branchOptions" :key="branch.id" :value="branch.id">
              {{ branch.name }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="isLoading" class="mt-2 text-xs text-gray-500">{{ $t('common.loading') }}</div>
      <div v-if="errorMessage" class="mt-2 text-xs text-red-600">{{ errorMessage }}</div>
      <div class="mt-3 flex flex-wrap items-center gap-3">
        <input
          v-model="formState.name"
          type="text"
          class="w-full max-w-xs rounded border border-gray-300 px-3 py-2 text-sm"
          :placeholder="$t('pages.private.manager.cashboxes.namePlaceholder')"
        />
        <label class="flex items-center gap-2 text-sm">
          <input v-model="formState.active" type="checkbox" class="rounded border-gray-300" />
          {{ $t('pages.private.manager.cashboxes.active') }}
        </label>
        <UButton color="primary" :disabled="!formState.name.trim() || !selectedBranchId" @click="handleCreateCashBox">
          {{ $t('pages.private.manager.cashboxes.create') }}
        </UButton>
      </div>
    </div>

    <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div class="text-sm font-semibold text-gray-900">{{ $t('pages.private.manager.cashboxes.listTitle') }}</div>
      <div v-if="!cashBoxes.length" class="mt-3 text-sm text-gray-600">{{ $t('pages.private.manager.cashboxes.empty') }}</div>
      <div v-else class="mt-3 space-y-2">
        <div v-for="cb in cashBoxes" :key="cb.id" class="flex items-center justify-between rounded border border-gray-200 px-3 py-2">
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
