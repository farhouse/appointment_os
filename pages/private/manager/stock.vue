<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { PaginationState } from '@tanstack/table-core'
import { useSelectedBranch } from '~/composables/useSelectedBranch'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN', 'MANAGER'],
})

type Product = {
  id: string
  name: string
  sku: string
}

type BranchInfo = {
  id: string
  name: string
}

type BranchStock = {
  branchId: string
  productId: string
  quantity: number
  minStock: number
  product: Product
  branch: BranchInfo
}

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const { t } = useI18n()
const toast = useToast()

const { selectedBranchId, branchOptions } = useSelectedBranch()

const stockRows = ref<BranchStock[]>([])
const products = ref<Product[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const modalOpen = ref(false)
const deleteOpen = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const selected = ref<BranchStock | null>(null)
const formRef = useTemplateRef('stockForm')

const stockSchema = z.object({
  branchId: z.string().min(1, t('admin.stock.form.branchRequired')),
  productId: z.string().min(1, t('admin.stock.form.productRequired')),
  quantity: z.number().int().min(0),
  minStock: z.number().int().min(0)
})

type StockForm = z.output<typeof stockSchema>

const formState = reactive<Partial<StockForm>>({
  branchId: '',
  productId: '',
  quantity: 0,
  minStock: 0
})

const branchItems = computed(() => branchOptions.value.map(branch => ({ label: branch.name, value: branch.id })))
const productItems = computed(() => products.value.map(product => ({ label: `${product.name} (${product.sku})`, value: product.id })))

const filteredRows = computed(() => stockRows.value)

const tableRef = useTemplateRef('table')

const { search: globalFilter, sorted, sortBy, sortDir, toggleSort } = useCrudTable(filteredRows, {
  search: (item, query) => {
    const q = query.toLowerCase()
    return [item.product.name, item.product.sku, item.branch.name].some(value => value.toLowerCase().includes(q))
  },
  initialSortBy: 'product.name',
  initialSortDir: 'asc'
})

const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 8 })

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

const filteredTotal = computed(() => tableRef.value?.tableApi.getFilteredRowModel().rows.length ?? sorted.value.length)
const pageCount = computed(() => tableRef.value?.tableApi.getPageCount?.() ?? Math.max(1, Math.ceil(filteredTotal.value / pageSize.value)))

watch([pageCount], () => {
  if (page.value > pageCount.value) page.value = pageCount.value
})

const columns: TableColumn<BranchStock>[] = [
  {
    accessorKey: 'product.name',
    header: () => h('button', {
      class: 'text-left font-semibold',
      onClick: () => toggleSort('product.name')
    }, t('admin.stock.columns.product')),
    cell: ({ row }) => h('div', { class: 'space-y-0.5' }, [
      h('div', { class: 'text-sm font-medium text-stone-900' }, row.original.product.name),
      h('div', { class: 'text-xs text-stone-500' }, row.original.product.sku)
    ])
  },
  {
    accessorKey: 'branch.name',
    header: () => h('button', {
      class: 'text-left font-semibold',
      onClick: () => toggleSort('branch.name')
    }, t('admin.stock.columns.branch')),
    cell: ({ row }) => row.original.branch.name
  },
  {
    accessorKey: 'quantity',
    header: () => h('button', {
      class: 'text-right font-semibold w-full',
      onClick: () => toggleSort('quantity')
    }, t('admin.stock.columns.quantity')),
    meta: { class: { td: 'text-right', th: 'text-right' } }
  },
  {
    accessorKey: 'minStock',
    header: () => h('button', {
      class: 'text-right font-semibold w-full',
      onClick: () => toggleSort('minStock')
    }, t('admin.stock.columns.minStock')),
    meta: { class: { td: 'text-right', th: 'text-right' } }
  },
  {
    id: 'actions',
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => h(UDropdownMenu, {
      items: getRowItems(row),
      content: { align: 'end' }
    }, () => h(UButton, {
      icon: 'i-lucide-ellipsis-vertical',
      color: 'neutral',
      variant: 'ghost',
      'aria-label': t('admin.common.actions')
    }))
  }
]

const tableMeta = {
  class: {
    tr: (row: Row<BranchStock>) => row.original.productId === selected.value?.productId ? 'bg-amber-50/70' : ''
  }
}

const isEditing = computed(() => !!selected.value)
const sortLabel = computed(() => sortBy.value ? `${sortBy.value}:${sortDir.value}` : '')
const hasData = computed(() => stockRows.value.length > 0)
const isEmpty = computed(() => !isLoading.value && !hasData.value && !errorMessage.value && !!selectedBranchId.value)
const needsBranch = computed(() => !selectedBranchId.value)

async function loadProducts() {
  try {
    products.value = await $fetch('/api/products')
  } catch {
    products.value = []
  }
}

async function loadStock() {
  if (!selectedBranchId.value) {
    stockRows.value = []
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  try {
    const query = new URLSearchParams({ branchId: selectedBranchId.value })
    stockRows.value = await $fetch(`/api/stock?${query.toString()}`)
  } catch (e: any) {
    stockRows.value = []
    errorMessage.value = e?.data?.statusMessage || t('admin.common.loadError')
  } finally {
    isLoading.value = false
  }
}

function resetForm() {
  formState.branchId = selectedBranchId.value || ''
  formState.productId = ''
  formState.quantity = 0
  formState.minStock = 0
}

function openCreate() {
  selected.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(row: BranchStock) {
  selected.value = row
  formState.branchId = row.branchId
  formState.productId = row.productId
  formState.quantity = row.quantity
  formState.minStock = row.minStock
  modalOpen.value = true
}

function requestDelete(row: BranchStock) {
  selected.value = row
  deleteOpen.value = true
}

function getRowItems(row: Row<BranchStock>): DropdownMenuItem[][] {
  return [
    [
      { label: t('admin.common.edit'), icon: 'i-lucide-pencil', onSelect: () => openEdit(row.original) },
      { label: t('admin.common.delete'), icon: 'i-lucide-trash', color: 'error', onSelect: () => requestDelete(row.original) }
    ]
  ]
}

async function saveStock(event: FormSubmitEvent<StockForm>) {
  isSaving.value = true
  try {
    await $fetch('/api/stock', {
      method: 'POST',
      body: event.data
    })
    toast.add({ title: isEditing.value ? t('admin.stock.toast.updated') : t('admin.stock.toast.created'), color: 'success' })
    modalOpen.value = false
    await loadStock()
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || t('admin.common.saveError'), color: 'error' })
  } finally {
    isSaving.value = false
  }
}

async function confirmDelete() {
  if (!selected.value) return
  isDeleting.value = true
  try {
    const query = new URLSearchParams({ branchId: selected.value.branchId, productId: selected.value.productId })
    await $fetch(`/api/stock?${query.toString()}`, { method: 'DELETE' })
    toast.add({ title: t('admin.stock.toast.deleted'), color: 'success' })
    deleteOpen.value = false
    selected.value = null
    await loadStock()
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || t('admin.common.deleteError'), color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

watch(selectedBranchId, (value) => {
  formState.branchId = value || ''
  void loadStock()
})

watch(modalOpen, (value) => {
  if (!value) {
    selected.value = null
    resetForm()
  }
})

onMounted(() => {
  void loadProducts()
  if (selectedBranchId.value) void loadStock()
})
</script>

<template>
  <CrudTableShell
    :title="$t('pages.private.managerStock')"
    :search-placeholder="$t('admin.stock.searchPlaceholder')"
    :search-value="globalFilter"
    :is-loading="isLoading"
    :error-message="errorMessage"
    :can-create="true"
    :create-label="$t('admin.stock.new')"
    @search="globalFilter = $event"
    @create="openCreate"
  >
    <div class="flex items-center justify-between border-b border-stone-200 px-4 py-3 text-xs text-stone-500">
      <div>{{ $t('admin.common.count', { count: filteredTotal }) }}</div>
      <div v-if="sortLabel">{{ $t('admin.common.sorting', { value: sortLabel }) }}</div>
    </div>

    <div v-if="needsBranch" class="p-6">
      <CrudState
        :title="$t('admin.stock.noBranchTitle')"
        :description="$t('admin.stock.noBranchDescription')"
        icon="i-lucide-map"
      />
    </div>

    <div v-else-if="isLoading" class="p-6">
      <USkeleton class="h-8 w-full" />
      <USkeleton class="mt-3 h-8 w-full" />
      <USkeleton class="mt-3 h-8 w-full" />
    </div>

    <div v-else-if="isEmpty" class="p-6">
      <CrudState
        :title="$t('admin.stock.emptyTitle')"
        :description="$t('admin.stock.emptyDescription')"
        icon="i-lucide-archive"
        :action-label="$t('admin.stock.new')"
        @action="openCreate"
      />
    </div>

    <div v-else-if="errorMessage" class="p-6">
      <CrudState
        :title="$t('admin.common.errorTitle')"
        :description="errorMessage"
        icon="i-lucide-alert-triangle"
        :action-label="$t('admin.common.retry')"
        @action="loadStock"
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
        :meta="tableMeta"
        @select="(_e, row) => openEdit(row.original)"
      />
      <div class="flex items-center justify-between border-t border-stone-200 px-4 py-3">
        <div class="text-xs text-stone-500">
          {{ $t('admin.common.pageInfo', { page, total: filteredTotal, size: pageSize }) }}
        </div>
        <UPagination v-model:page="page" :total="filteredTotal" :items-per-page="pageSize" />
      </div>
    </div>
  </CrudTableShell>

  <UModal v-model:open="modalOpen" :title="isEditing ? $t('admin.stock.editTitle') : $t('admin.stock.newTitle')" :ui="{ footer: 'justify-end' }">
    <template #body>
      <UForm ref="stockForm" :schema="stockSchema" :state="formState" class="space-y-4" @submit="saveStock">
        <UFormField :label="$t('admin.stock.form.branch')" name="branchId">
          <USelect v-model="formState.branchId" :items="branchItems" value-key="value" :disabled="isEditing" />
        </UFormField>
        <UFormField :label="$t('admin.stock.form.product')" name="productId">
          <USelect v-model="formState.productId" :items="productItems" value-key="value" :disabled="isEditing" />
        </UFormField>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField :label="$t('admin.stock.form.quantity')" name="quantity">
            <UInputNumber v-model="formState.quantity" :min="0" />
          </UFormField>
          <UFormField :label="$t('admin.stock.form.minStock')" name="minStock">
            <UInputNumber v-model="formState.minStock" :min="0" />
          </UFormField>
        </div>
        <div class="hidden">
          <UButton type="submit" />
        </div>
      </UForm>
    </template>
    <template #footer>
      <UButton color="neutral" variant="outline" @click="modalOpen = false">
        {{ $t('common.cancel') }}
      </UButton>
      <UButton color="primary" :loading="isSaving" @click="formRef?.submit()">
        {{ isEditing ? $t('admin.common.save') : $t('admin.common.create') }}
      </UButton>
    </template>
  </UModal>

  <UModal v-model:open="deleteOpen" :title="$t('admin.stock.deleteTitle')" :ui="{ footer: 'justify-end' }">
    <template #body>
      <p class="text-sm text-stone-600">
        {{ $t('admin.stock.deleteConfirm', { name: selected?.product?.name || '' }) }}
      </p>
    </template>
    <template #footer>
      <UButton color="neutral" variant="outline" @click="deleteOpen = false">
        {{ $t('common.cancel') }}
      </UButton>
      <UButton color="error" :loading="isDeleting" @click="confirmDelete">
        {{ $t('admin.common.delete') }}
      </UButton>
    </template>
  </UModal>
</template>
