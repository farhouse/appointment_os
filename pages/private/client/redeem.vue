<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['CLIENT'],
})

type Product = {
  id: string
  name: string
  sku: string
  description: string | null
  pointsCost: number
}

type LedgerEntry = {
  id: string
  points: number
  reason: string | null
  createdAt: string
}

const { t } = useI18n()
const toast = useToast()

const products = ref<Product[]>([])
const entries = ref<LedgerEntry[]>([])
const balance = ref(0)
const isLoading = ref(false)
const redeemingId = ref<string | null>(null)
const errorMessage = ref('')

const quantity = reactive<Record<string, number>>({})

const redeemable = computed(() => products.value.filter(product => product.pointsCost > 0))
const isEmpty = computed(() => !isLoading.value && !errorMessage.value && redeemable.value.length === 0)

const dateFormatter = new Intl.DateTimeFormat('es-AR', { year: 'numeric', month: 'short', day: '2-digit' })
function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function formatReason(entry: LedgerEntry) {
  if (entry.reason && entry.reason.startsWith('APPOINTMENT:')) {
    return formatDate(entry.createdAt)
  }
  return entry.reason || '—'
}

async function loadPoints() {
  const data = await $fetch('/api/client/points')
  balance.value = data.balance
  entries.value = data.entries
}

async function loadProducts() {
  products.value = await $fetch('/api/public/products?redeemable=true')
}

async function loadData() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    await Promise.all([loadPoints(), loadProducts()])
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage || t('admin.common.loadError')
  } finally {
    isLoading.value = false
  }
}

function getQuantity(productId: string) {
  return quantity[productId] ?? 1
}

function setQuantity(productId: string, value?: number | null) {
  quantity[productId] = Math.max(1, Number(value || 1))
}

async function redeem(product: Product) {
  const qty = getQuantity(product.id)
  const total = product.pointsCost * qty
  if (total > balance.value) {
    toast.add({ title: t('client.redeem.insufficient'), color: 'error' })
    return
  }

  redeemingId.value = product.id
  try {
    await $fetch('/api/client/redeem', {
      method: 'POST',
      body: { productId: product.id, quantity: qty }
    })
    toast.add({ title: t('client.redeem.success'), color: 'success' })
    await loadPoints()
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || t('client.redeem.error'), color: 'error' })
  } finally {
    redeemingId.value = null
  }
}

onMounted(() => {
  void loadData()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">{{ $t('pages.private.clientRedeem') }}</h1>
      <p class="text-sm text-gray-600">{{ $t('client.redeem.subtitle') }}</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:col-span-2">
        <div v-if="isLoading" class="space-y-2">
          <USkeleton class="h-4 w-32" />
          <USkeleton class="h-8 w-24" />
          <USkeleton class="h-4 w-20" />
        </div>
        <div v-else class="flex items-center justify-between">
          <div>
            <div class="text-xs uppercase tracking-wide text-stone-500">{{ $t('client.redeem.balanceLabel') }}</div>
            <div class="text-2xl font-semibold text-stone-900">{{ balance }}</div>
          </div>
          <div class="text-sm text-stone-500">{{ $t('client.redeem.pointsUnit') }}</div>
        </div>
      </div>
      <div class="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div class="text-xs uppercase tracking-wide text-stone-500">{{ $t('client.redeem.recentTitle') }}</div>
        <div v-if="isLoading" class="mt-3 space-y-2">
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-4/5" />
          <USkeleton class="h-4 w-3/5" />
        </div>
        <div v-else-if="entries.length === 0" class="mt-3 text-sm text-stone-500">{{ $t('client.redeem.recentEmpty') }}</div>
        <div v-else class="mt-3 space-y-3">
          <div v-for="entry in entries" :key="entry.id" class="flex items-center justify-between text-sm">
            <div>
              <div class="text-stone-800">{{ formatReason(entry) }}</div>
              <div class="text-xs text-stone-500">{{ formatDate(entry.createdAt) }}</div>
            </div>
            <div :class="entry.points >= 0 ? 'text-emerald-600' : 'text-rose-600'">
              {{ entry.points >= 0 ? '+' : '' }}{{ entry.points }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-stone-200 bg-white shadow-sm">
      <div class="border-b border-stone-200 px-4 py-3 text-xs text-stone-500">
        {{ $t('client.redeem.productsTitle') }}
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
          @action="loadData"
        />
      </div>

      <div v-else-if="isEmpty" class="p-6">
        <CrudState
          :title="$t('client.redeem.emptyTitle')"
          :description="$t('client.redeem.emptyDescription')"
          icon="i-lucide-gift"
        />
      </div>

      <div v-else class="divide-y divide-stone-200">
        <div v-for="product in redeemable" :key="product.id" class="p-4 sm:p-5">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div class="text-sm text-stone-500">{{ product.sku }}</div>
              <div class="text-base font-semibold text-stone-900">{{ product.name }}</div>
              <div v-if="product.description" class="mt-1 text-sm text-stone-600">{{ product.description }}</div>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-right">
                <div class="text-xs uppercase tracking-wide text-stone-500">{{ $t('client.redeem.costLabel') }}</div>
                <div class="text-lg font-semibold text-stone-900">{{ product.pointsCost }}</div>
              </div>
              <div class="w-24">
                <UInputNumber
                  :min="1"
                  :model-value="getQuantity(product.id)"
                  @update:model-value="value => setQuantity(product.id, value)"
                />
              </div>
              <UButton color="primary" :loading="redeemingId === product.id" @click="redeem(product)">
                {{ $t('client.redeem.redeemAction') }}
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
