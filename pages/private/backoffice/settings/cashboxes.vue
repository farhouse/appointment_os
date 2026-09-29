<script setup lang="ts">
import { useSelectedBranch } from '~/composables/useSelectedBranch'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN']
})

const { t } = useI18n()

type CashBox = {
  id: string
  name: string
  active: boolean
  branch: { id: string; name: string }
}

const { selectedBranchId, branchOptions } = useSelectedBranch()

const cashBoxBranchId = ref('')
const cashBoxes = ref<CashBox[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const formState = reactive({
  name: '',
  active: true
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
    errorMessage.value = e?.data?.statusMessage || t('admin.common.loadError')
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
    errorMessage.value = e?.data?.statusMessage || t('admin.common.createError')
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
    errorMessage.value = e?.data?.statusMessage || t('admin.common.saveError')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadCashBoxes()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">{{ $t('pages.private.managerSettings') }}</h1>
      <p class="text-sm text-gray-600">{{ $t('pages.private.managerSettingsNav.cashboxesDesc') }}</p>
    </div>

    <BackofficeSettingsNav />

    <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-sm font-semibold text-gray-900">{{ $t('pages.private.manager.cashboxes.newTitle') }}</div>
          <div class="text-xs text-gray-500">{{ $t('pages.private.manager.cashboxes.subtitle') }}</div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
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
</template>
