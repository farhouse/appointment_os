<script setup lang="ts">
import { useSelectedBranch } from '~/composables/useSelectedBranch'

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

const { selectedBranchId, branchOptions } = useSelectedBranch()

const cashBoxes = ref<CashBox[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

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
  if (canLoadCashBoxes.value) void loadCashBoxes()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">{{ $t('pages.private.managerSettings') }}</h1>
      <p class="text-sm text-gray-600">Gestiona las cajas por sucursal.</p>
    </div>

    <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div class="flex flex-wrap items-center gap-3">
        <label class="text-sm font-medium">Sucursal</label>
        <select v-model="selectedBranchId" class="rounded border border-gray-300 px-3 py-2 text-sm">
          <option value="" disabled>Selecciona una sucursal</option>
          <option v-for="branch in branchOptions" :key="branch.id" :value="branch.id">
            {{ branch.name }}
          </option>
        </select>
        <div v-if="isLoading" class="text-xs text-gray-500">Cargando...</div>
        <div v-if="errorMessage" class="text-xs text-red-600">{{ errorMessage }}</div>
      </div>
    </div>

    <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div class="text-sm font-semibold text-gray-900">Nueva caja</div>
      <div class="mt-3 flex flex-wrap items-center gap-3">
        <input
          v-model="formState.name"
          type="text"
          class="w-full max-w-xs rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="Efectivo"
        />
        <label class="flex items-center gap-2 text-sm">
          <input v-model="formState.active" type="checkbox" class="rounded border-gray-300" />
          Activa
        </label>
        <UButton color="primary" :disabled="!formState.name.trim() || !selectedBranchId" @click="handleCreateCashBox">
          Crear caja
        </UButton>
      </div>
    </div>

    <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div class="text-sm font-semibold text-gray-900">Cajas registradas</div>
      <div v-if="!cashBoxes.length" class="mt-3 text-sm text-gray-600">Sin cajas cargadas.</div>
      <div v-else class="mt-3 space-y-2">
        <div v-for="cb in cashBoxes" :key="cb.id" class="flex items-center justify-between rounded border border-gray-200 px-3 py-2">
          <div>
            <div class="text-sm font-medium text-gray-900">{{ cb.name }}</div>
            <div class="text-xs text-gray-500">{{ cb.active ? 'Activa' : 'Inactiva' }}</div>
          </div>
          <UButton variant="outline" size="sm" @click="toggleCashBox(cb)">
            {{ cb.active ? 'Desactivar' : 'Activar' }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
