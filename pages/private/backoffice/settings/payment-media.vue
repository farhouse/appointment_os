<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN']
})

const paymentMethods = ref<{ method: string; label: string; active: boolean }[]>([])
const paymentMedia = ref<{ id: string; method: string; name: string; description?: string | null; active: boolean; isSystem: boolean }[]>([])
const customPaymentMedia = computed(() => paymentMedia.value.filter(item => !item.isSystem))
const paymentMethodsLoading = ref(false)
const paymentMethodsError = ref('')
const paymentMediaSaving = ref(false)

const paymentMediumForm = reactive({
  method: 'CARD',
  name: '',
  description: ''
})

function getMethodLabel(method: string) {
  const labelMap: Record<string, string> = {
    CASH: $t('manager.cash.methodCash'),
    CARD: $t('manager.cash.methodCard'),
    TRANSFER: $t('manager.cash.methodTransfer'),
    OTHER: $t('manager.cash.methodOther')
  }
  return labelMap[method] || method
}

function getMediumDisplayName(name: string) {
  const upper = (name || '').toUpperCase().trim()
  if (upper === 'CASH') return 'Efectivo'
  if (upper === 'CARD' || upper === 'CREDIT' || upper === 'DEBIT') return 'Tarjeta'
  if (upper === 'TRANSFER' || upper === 'TRANSFERENCIA') return 'Transferencia'
  if (upper === 'OTHER' || upper === 'OTRO') return 'Otro'
  return name
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

onMounted(() => {
  void loadPaymentMethods()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">{{ $t('pages.private.managerSettings') }}</h1>
      <p class="text-sm text-gray-600">{{ $t('pages.private.managerSettingsNav.paymentMediaDesc') }}</p>
    </div>

    <BackofficeSettingsNav />

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
              <div class="text-sm font-medium text-gray-900">{{ getMediumDisplayName(item.name) }} <span class="text-xs text-gray-500">({{ getMethodLabel(item.method) }})</span></div>
              <div class="text-xs text-gray-500">{{ item.description || '—' }}</div>
            </div>
            <UButton size="xs" variant="outline" :loading="paymentMediaSaving" @click="togglePaymentMedium(item)">
              {{ item.active ? $t('pages.private.manager.paymentMethods.deactivate') : $t('pages.private.manager.paymentMethods.activate') }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
