<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { PaginationState } from '@tanstack/table-core'
import { getPaginationRowModel } from '@tanstack/vue-table'
import { useSelectedBranch } from '~/composables/useSelectedBranch'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN', 'MANAGER'],
})

type SaleItem = {
  id: string
  name: string
  quantity: number
  price: string
}

type Sale = {
  id: string
  total: string
  paymentMethod: string
  paymentMediumId: string | null
  createdAt: string
  items: SaleItem[]
}

type CashBox = {
  id: string
  name: string
}

type PaymentMedium = {
  id: string
  method: string
  name: string
  active: boolean
}

type FormItem = {
  type: 'PRODUCT' | 'SERVICE' | 'CONCEPT'
  productId?: string
  serviceId?: string
  name: string
  quantity: number
  price: number
}

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')

const toast = useToast()
const { t } = useI18n()
const { selectedBranchId } = useSelectedBranch()

const tableUi = useBackofficeTableUi()

const sales = ref<Sale[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const modalOpen = ref(false)
const isSaving = ref(false)

const products = ref<any[]>([])
const services = ref<any[]>([])
const cashBoxes = ref<CashBox[]>([])
const paymentMedia = ref<PaymentMedium[]>([])

const dateFrom = ref(new Date().toISOString().split('T')[0])
const dateTo = ref(new Date().toISOString().split('T')[0])

const saleForm = reactive({
  items: [] as FormItem[],
  paymentMethod: 'CASH' as string,
  paymentMediumId: '',
  cashBoxId: ''
})

const { search: globalFilter, sorted, sortBy, sortDir, toggleSort } = useCrudTable(sales, {
  search: (item, query) => {
    const q = query.toLowerCase()
    return item.items.some(i => i.name.toLowerCase().includes(q))
  },
  initialSortBy: 'createdAt',
  initialSortDir: 'desc'
})

const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 })

const page = computed({
  get: () => pagination.value.pageIndex + 1,
  set: (value: number) => {
    pagination.value.pageIndex = Math.max(0, value - 1)
  }
})

const pageSize = computed({
  get: () => pagination.value.pageSize,
  set: (value: number) => {
    pagination.value.pageSize = value
    pagination.value.pageIndex = 0
  }
})

watch(globalFilter, () => {
  pagination.value.pageIndex = 0
})

const filteredTotal = computed<number>(() => sorted.value.length)
const pageCount = computed(() => Math.max(1, Math.ceil(filteredTotal.value / pageSize.value)))

watch([pageCount], () => {
  if (page.value > pageCount.value) page.value = pageCount.value
})

function formatCurrency(value: string) {
  const n = Number(value)
  if (Number.isNaN(n)) return value
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-AR', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

function getPaymentMethodLabel(method: string) {
  const key = `admin.sales.columns.${method}` as any
  const result = t(key)
  return result !== key ? result : method
}

function getMediumDisplayName(medium: PaymentMedium) {
  return medium.name
}

const baseColumns: TableColumn<Sale>[] = [
  {
    accessorKey: 'createdAt',
    header: () => h('button', {
      class: 'text-left font-semibold',
      onClick: () => toggleSort('createdAt')
    }, t('admin.sales.columns.createdAt')),
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: 'items',
    header: () => h('span', { class: 'font-semibold' }, t('admin.sales.columns.items')),
    cell: ({ row }) => h('div', { class: 'space-y-0.5' }, [
      h('div', { class: 'text-sm font-medium text-stone-900' },
        row.original.items.map(i => `${i.quantity}x ${i.name}`).join(', ')
      ),
    ])
  },
  {
    accessorKey: 'total',
    header: () => h('button', {
      class: 'text-right font-semibold w-full',
      onClick: () => toggleSort('total')
    }, t('admin.sales.columns.total')),
    cell: ({ row }) => h('div', { class: 'text-right font-medium' }, formatCurrency(row.original.total)),
    meta: { class: { td: 'text-right', th: 'text-right' } }
  },
  {
    id: 'paymentMethod',
    header: () => h('span', { class: 'font-semibold' }, t('admin.sales.columns.paymentMethod')),
    cell: ({ row }) => {
      const method = row.original.paymentMethod
      const color = method === 'CASH' ? 'success' : method === 'CARD' ? 'info' : 'neutral'
      return h(UBadge, { color, variant: 'subtle', label: getPaymentMethodLabel(method) })
    },
  },
]

const columns = computed<TableColumn<Sale>[]>(() => baseColumns)

const sortLabel = computed(() => sortBy.value ? `${sortBy.value}:${sortDir.value}` : '')
const hasData = computed(() => sales.value.length > 0)
const isEmpty = computed(() => !isLoading.value && !hasData.value && !errorMessage.value)

const formTotal = computed(() => {
  return saleForm.items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
})

function resetForm() {
  saleForm.items = []
  saleForm.paymentMethod = 'CASH'
  saleForm.paymentMediumId = ''
  saleForm.cashBoxId = ''
}

function addItem() {
  saleForm.items.push({
    type: 'PRODUCT',
    name: '',
    quantity: 1,
    price: 0
  })
}

function removeItem(index: number) {
  saleForm.items.splice(index, 1)
}

function onItemChange(item: FormItem) {
  if (item.type === 'PRODUCT' && item.productId) {
    const p = products.value.find(x => x.id === item.productId)
    if (p) {
      item.name = p.name
      item.price = Number(p.price)
    }
  } else if (item.type === 'SERVICE' && item.serviceId) {
    const s = services.value.find(x => x.id === item.serviceId)
    if (s) {
      item.name = s.name
      item.price = Number(s.price)
    }
  } else if (item.type === 'CONCEPT') {
    item.productId = undefined
    item.serviceId = undefined
  }
}

async function loadSales() {
  if (!selectedBranchId.value) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    const query = new URLSearchParams({ branchId: selectedBranchId.value })
    if (dateFrom.value) query.set('from', dateFrom.value)
    if (dateTo.value) query.set('to', dateTo.value)
    sales.value = await $fetch(`/api/sales?${query.toString()}`)
  } catch (e: any) {
    sales.value = []
    errorMessage.value = e?.data?.statusMessage || t('admin.common.loadError')
  } finally {
    isLoading.value = false
  }
}

async function loadFormDeps() {
  const cashboxesReq = selectedBranchId.value
    ? $fetch(`/api/cashboxes?branchId=${selectedBranchId.value}&activeOnly=true`)
    : Promise.resolve([])

  const [prodRes, servRes, cashRes, payRes] = await Promise.allSettled([
    $fetch('/api/products'),
    $fetch('/api/services'),
    cashboxesReq,
    $fetch('/api/settings/payment-methods')
  ])

  products.value = prodRes.status === 'fulfilled' ? (prodRes.value as any[]) : []
  services.value = servRes.status === 'fulfilled' ? ((servRes.value as any[]).filter((s: any) => s.active)) : []
  cashBoxes.value = cashRes.status === 'fulfilled' ? (cashRes.value as any[]) : []
  paymentMedia.value = payRes.status === 'fulfilled' ? (((payRes.value as any)?.media || []).filter((m: any) => m.active)) : []
}

function openCreate() {
  resetForm()
  addItem()
  const firstMedium = paymentMedia.value.find((m: any) => m.active)
  saleForm.paymentMediumId = firstMedium?.id || ''
  saleForm.paymentMethod = firstMedium?.method || 'CASH'
  modalOpen.value = true
}

async function submitSale() {
  if (!saleForm.cashBoxId) {
    toast.add({ title: t('admin.sales.form.cashboxRequired'), color: 'warning' })
    return
  }
  if (!saleForm.paymentMediumId) {
    toast.add({ title: t('admin.sales.form.paymentMediumRequired'), color: 'warning' })
    return
  }

  try {
    const session = await $fetch(`/api/cash/sessions/current?branchId=${selectedBranchId.value}&cashBoxId=${saleForm.cashBoxId}`)
    if (!session) {
      toast.add({ title: t('admin.sales.form.openCashRequired'), color: 'error' })
      return
    }
  } catch {
    return
  }

  const selectedMedium = paymentMedia.value.find((m: any) => m.id === saleForm.paymentMediumId)
  const paymentMethod = selectedMedium?.method || saleForm.paymentMethod

  isSaving.value = true
  try {
    await $fetch('/api/sales', {
      method: 'POST',
      body: {
        branchId: selectedBranchId.value,
        cashBoxId: saleForm.cashBoxId,
        items: saleForm.items.map(i => ({
          productId: i.type === 'PRODUCT' ? i.productId : undefined,
          serviceId: i.type === 'SERVICE' ? i.serviceId : undefined,
          name: i.name,
          quantity: i.quantity,
          price: i.price
        })),
        total: formTotal.value,
        paymentMethod,
        paymentMediumId: saleForm.paymentMediumId
      }
    })
    toast.add({ title: t('admin.sales.toast.created'), color: 'success' })
    modalOpen.value = false
    await loadSales()
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || t('admin.sales.toast.saveError'), color: 'error' })
  } finally {
    isSaving.value = false
  }
}

watch(selectedBranchId, () => {
  loadSales()
  loadFormDeps()
})

watch([dateFrom, dateTo], () => {
  loadSales()
})

watch(modalOpen, (value) => {
  if (!value) {
    resetForm()
  } else {
    loadFormDeps()
  }
})

onMounted(() => {
  if (selectedBranchId.value) {
    loadSales()
  }
  loadFormDeps()
})
</script>

<template>
  <CrudTableShell
    :title="$t('nav.sales')"
    :search-placeholder="$t('admin.sales.searchPlaceholder')"
    :search-value="globalFilter"
    :is-loading="isLoading"
    :error-message="errorMessage"
    :can-create="true"
    :create-label="$t('admin.sales.new')"
    @search="globalFilter = $event"
    @create="openCreate"
  >
    <template #controls>
      <UInput type="date" v-model="dateFrom" :aria-label="$t('admin.sales.filters.from')" class="w-40" />
      <UInput type="date" v-model="dateTo" :aria-label="$t('admin.sales.filters.to')" class="w-40" />
    </template>

    <div class="flex items-center justify-between border-b border-stone-200 px-4 py-3 text-xs text-stone-500">
      <div>{{ $t('admin.common.count', { count: filteredTotal }) }}</div>
      <div v-if="sortLabel">{{ $t('admin.common.sorting', { value: sortLabel }) }}</div>
    </div>

    <div v-if="isLoading && !hasData" class="p-6">
      <USkeleton class="h-8 w-full" />
      <USkeleton class="mt-3 h-8 w-full" />
      <USkeleton class="mt-3 h-8 w-full" />
    </div>

    <div v-else-if="isEmpty" class="p-6">
      <CrudState
        :title="$t('admin.sales.emptyTitle')"
        :description="$t('admin.sales.emptyDescription')"
        icon="i-lucide-shopping-cart"
        :action-label="$t('admin.sales.new')"
        @action="openCreate"
      />
    </div>

    <div v-else-if="errorMessage" class="p-6">
      <CrudState
        :title="$t('admin.common.errorTitle')"
        :description="errorMessage"
        icon="i-lucide-alert-triangle"
        :action-label="$t('admin.common.retry')"
        @action="loadSales"
      />
    </div>

    <div v-else>
      <UTable
        ref="table"
        v-model:global-filter="globalFilter"
        v-model:pagination="pagination"
        :pagination-options="({ getPaginationRowModel: getPaginationRowModel() } as any)"
        :data="sorted"
        :columns="columns"
        :loading="isLoading"
        :ui="tableUi"
      />
      <div class="flex items-center justify-between border-t border-stone-200 px-4 py-3">
        <div class="text-xs text-stone-500">
          {{ $t('admin.common.pageInfo', { page, total: filteredTotal, size: pageSize }) }}
        </div>
        <UPagination v-model:page="page" :total="filteredTotal" :items-per-page="pageSize" />
      </div>
    </div>
  </CrudTableShell>

  <UModal v-model:open="modalOpen" :title="$t('admin.sales.newTitle')" class="max-w-3xl">
    <template #body>
      <div class="space-y-4">
        <div class="space-y-2">
          <div v-for="(item, index) in saleForm.items" :key="index" class="flex gap-2 items-start">
            <div class="w-32">
              <select
                v-model="item.type"
                class="w-full rounded-md border border-stone-300 bg-white px-2 py-2 text-sm"
                @change="onItemChange(item)"
              >
                <option value="PRODUCT">{{ $t('admin.sales.form.product') }}</option>
                <option value="SERVICE">{{ $t('admin.sales.form.service') }}</option>
                <option value="CONCEPT">{{ $t('admin.sales.form.concept') }}</option>
              </select>
            </div>

            <div class="flex-1">
              <select
                v-if="item.type === 'PRODUCT'"
                v-model="item.productId"
                class="w-full rounded-md border border-stone-300 bg-white px-2 py-2 text-sm"
                @change="onItemChange(item)"
              >
                <option disabled value="">{{ $t('admin.sales.form.selectProduct') }}</option>
                <option v-for="product in products" :key="product.id" :value="product.id">
                  {{ product.name }}
                </option>
              </select>
              <select
                v-else-if="item.type === 'SERVICE'"
                v-model="item.serviceId"
                class="w-full rounded-md border border-stone-300 bg-white px-2 py-2 text-sm"
                @change="onItemChange(item)"
              >
                <option disabled value="">{{ $t('admin.sales.form.selectService') }}</option>
                <option v-for="service in services" :key="service.id" :value="service.id">
                  {{ service.name }}
                </option>
              </select>
              <UInput v-else v-model="item.name" :placeholder="$t('admin.sales.form.conceptPlaceholder')" />
            </div>

            <div class="w-20">
              <UInput type="number" v-model.number="item.quantity" min="1" :placeholder="$t('admin.sales.form.quantity')" />
            </div>
            <div class="w-24">
              <UInput type="number" v-model.number="item.price" min="0" step="0.01" :placeholder="$t('admin.sales.form.price')" />
            </div>
            <UButton icon="i-heroicons-trash" color="error" variant="ghost" :aria-label="`Quitar ${item.name || 'ítem'}`" @click="removeItem(index)" />
          </div>
          <UButton icon="i-heroicons-plus" variant="soft" block @click="addItem">
            {{ $t('admin.sales.form.addItem') }}
          </UButton>
        </div>

        <div class="grid grid-cols-2 gap-4 border-t border-stone-200 pt-4">
          <div>
            <label class="text-sm font-medium text-stone-700">{{ $t('admin.sales.form.cashbox') }}</label>
            <select v-model="saleForm.cashBoxId" class="mt-1 w-full rounded-md border border-stone-300 bg-white px-2 py-2 text-sm">
              <option disabled value="">{{ $t('admin.sales.form.selectCashbox') }}</option>
              <option v-for="box in cashBoxes" :key="box.id" :value="box.id">{{ box.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium text-stone-700">{{ $t('admin.sales.form.paymentMedium') }}</label>
            <select v-model="saleForm.paymentMediumId" class="mt-1 w-full rounded-md border border-stone-300 bg-white px-2 py-2 text-sm">
              <option disabled value="">{{ $t('admin.sales.form.selectPaymentMedium') }}</option>
              <option v-for="medium in paymentMedia" :key="medium.id" :value="medium.id">
                {{ getMediumDisplayName(medium) }}
              </option>
            </select>
            <p class="mt-1 text-xs text-stone-500">
              {{ $t('admin.sales.form.detectedMethod', { method: getPaymentMethodLabel(saleForm.paymentMethod) }) }}
            </p>
          </div>
        </div>

        <div class="text-right text-xl font-bold border-t border-stone-200 pt-4">
          {{ $t('admin.sales.form.total') }}: ${{ formTotal }}
        </div>
      </div>
    </template>
    <template #footer>
      <UButton color="neutral" variant="outline" @click="modalOpen = false">
        {{ $t('admin.sales.form.cancel') }}
      </UButton>
      <UButton color="primary" :loading="isSaving" @click="submitSale">
        {{ $t('admin.sales.form.register') }}
      </UButton>
    </template>
  </UModal>
</template>
