<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { PaginationState } from '@tanstack/table-core'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN', 'MANAGER'],
})

type Product = {
  id: string
  name: string
  sku: string
  description: string | null
  price: string
  cost: string | null
  pointsCost: number
  createdAt: string
  updatedAt: string
}

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()
const { t } = useI18n()

const products = ref<Product[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const modalOpen = ref(false)
const deleteOpen = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const selected = ref<Product | null>(null)
const formRef = useTemplateRef('productForm')

const productSchema = z.object({
  name: z.string().min(1, t('admin.products.form.nameRequired')),
  sku: z.string().min(1, t('admin.products.form.skuRequired')),
  description: z.string().optional().nullable(),
  price: z.number().nonnegative(),
  cost: z.number().nonnegative().optional().nullable(),
  pointsCost: z.number().int().nonnegative().default(0)
})

type ProductForm = z.output<typeof productSchema>

const formState = reactive<Partial<ProductForm>>({
  name: '',
  sku: '',
  description: '',
  price: 0,
  cost: undefined,
  pointsCost: 0
})

const tableRef = useTemplateRef('table')

const { search: globalFilter, sorted, sortBy, sortDir, toggleSort } = useCrudTable(products, {
  search: (item, query) => {
    const q = query.toLowerCase()
    return [item.name, item.sku, item.description].filter(Boolean).some(value => value!.toLowerCase().includes(q))
  },
  initialSortBy: 'updatedAt',
  initialSortDir: 'desc'
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

const columns: TableColumn<Product>[] = [
  {
    accessorKey: 'name',
    header: () => h('button', {
      class: 'text-left font-semibold',
      onClick: () => toggleSort('name')
    }, t('admin.products.columns.name'))
  },
  {
    accessorKey: 'price',
    header: () => h('button', {
      class: 'text-left font-semibold',
      onClick: () => toggleSort('price')
    }, t('admin.products.columns.price')),
    cell: ({ row }) => formatCurrency(row.original.price),
    meta: { class: { td: 'text-right', th: 'text-right' } }
  },
  {
    accessorKey: 'pointsCost',
    header: () => h('button', {
      class: 'text-left font-semibold',
      onClick: () => toggleSort('pointsCost')
    }, t('admin.products.columns.pointsCost')),
    cell: ({ row }) => row.original.pointsCost ? row.original.pointsCost.toString() : '—',
    meta: { class: { td: 'text-right', th: 'text-right' } }
  },
  {
    accessorKey: 'pointsCost',
    header: () => h('button', {
      class: 'text-left font-semibold',
      onClick: () => toggleSort('pointsCost')
    }, t('admin.products.columns.pointsCost')),
    cell: ({ row }) => row.original.pointsCost ? row.original.pointsCost.toString() : '—',
    meta: { class: { td: 'text-right', th: 'text-right' } }
  },
  {
    accessorKey: 'updatedAt',
    header: () => h('button', {
      class: 'text-left font-semibold',
      onClick: () => toggleSort('updatedAt')
    }, t('admin.products.columns.updatedAt')),
    cell: ({ row }) => formatDate(row.original.updatedAt)
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
    tr: (row: Row<Product>) => row.original.id === selected.value?.id ? 'bg-amber-50/70' : ''
  }
}

const isEditing = computed(() => !!selected.value?.id)
const sortLabel = computed(() => sortBy.value ? `${sortBy.value}:${sortDir.value}` : '')
const hasData = computed(() => products.value.length > 0)
const isEmpty = computed(() => !isLoading.value && !hasData.value && !errorMessage.value)

async function loadProducts() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    products.value = await $fetch('/api/products')
  } catch (e: any) {
    products.value = []
    errorMessage.value = e?.data?.statusMessage || t('admin.common.loadError')
  } finally {
    isLoading.value = false
  }
}

function formatCurrency(value: string) {
  const numberValue = Number(value)
  if (Number.isNaN(numberValue)) return value
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(numberValue)
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-AR', { year: 'numeric', month: 'short', day: '2-digit' })
}

function resetForm() {
  formState.name = ''
  formState.sku = ''
  formState.description = ''
  formState.price = 0
  formState.cost = undefined
  formState.pointsCost = 0
}

function openCreate() {
  selected.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(product: Product) {
  selected.value = product
  formState.name = product.name
  formState.sku = product.sku
  formState.description = product.description ?? ''
  formState.price = Number(product.price)
  formState.cost = product.cost ? Number(product.cost) : undefined
  formState.pointsCost = Number(product.pointsCost ?? 0)
  modalOpen.value = true
}

function requestDelete(product: Product) {
  selected.value = product
  deleteOpen.value = true
}

watch(modalOpen, (value) => {
  if (!value) {
    selected.value = null
    resetForm()
  }
})

function getRowItems(row: Row<Product>): DropdownMenuItem[][] {
  return [
    [
      { label: t('admin.common.edit'), icon: 'i-lucide-pencil', onSelect: () => openEdit(row.original) },
      { label: t('admin.common.delete'), icon: 'i-lucide-trash', color: 'error', onSelect: () => requestDelete(row.original) }
    ]
  ]
}

async function saveProduct(event: FormSubmitEvent<ProductForm>) {
  isSaving.value = true
  try {
    if (selected.value) {
      await $fetch(`/api/products/${selected.value.id}`, {
        method: 'PATCH',
        body: event.data
      })
      toast.add({ title: t('admin.products.toast.updated'), color: 'success' })
    } else {
      await $fetch('/api/products', {
        method: 'POST',
        body: event.data
      })
      toast.add({ title: t('admin.products.toast.created'), color: 'success' })
    }
    modalOpen.value = false
    await loadProducts()
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
    await $fetch(`/api/products/${selected.value.id}`, { method: 'DELETE' })
    toast.add({ title: t('admin.products.toast.deleted'), color: 'success' })
    deleteOpen.value = false
    selected.value = null
    await loadProducts()
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || t('admin.common.deleteError'), color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  void loadProducts()
})
</script>

<template>
  <CrudTableShell
    :title="$t('pages.private.managerProducts')"
    :search-placeholder="$t('admin.products.searchPlaceholder')"
    :search-value="globalFilter"
    :is-loading="isLoading"
    :error-message="errorMessage"
    :can-create="true"
    :create-label="$t('admin.products.new')"
    @search="globalFilter = $event"
    @create="openCreate"
  >
    <div class="flex items-center justify-between border-b border-stone-200 px-4 py-3 text-xs text-stone-500">
      <div>{{ $t('admin.common.count', { count: filteredTotal }) }}</div>
      <div v-if="sortLabel">{{ $t('admin.common.sorting', { value: sortLabel }) }}</div>
    </div>

    <div v-if="isLoading" class="p-6">
      <USkeleton class="h-8 w-full" />
      <USkeleton class="mt-3 h-8 w-full" />
      <USkeleton class="mt-3 h-8 w-full" />
    </div>

    <div v-else-if="isEmpty" class="p-6">
      <CrudState
        :title="$t('admin.products.emptyTitle')"
        :description="$t('admin.products.emptyDescription')"
        icon="i-lucide-box"
        :action-label="$t('admin.products.new')"
        @action="openCreate"
      />
    </div>

    <div v-else-if="errorMessage" class="p-6">
      <CrudState
        :title="$t('admin.common.errorTitle')"
        :description="errorMessage"
        icon="i-lucide-alert-triangle"
        :action-label="$t('admin.common.retry')"
        @action="loadProducts"
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

  <UModal v-model:open="modalOpen" :title="isEditing ? $t('admin.products.editTitle') : $t('admin.products.newTitle')" :ui="{ footer: 'justify-end' }">
    <template #body>
      <UForm ref="productForm" :schema="productSchema" :state="formState" class="space-y-4" @submit="saveProduct">
        <UFormField :label="$t('admin.products.form.name')" name="name">
          <UInput v-model="formState.name" />
        </UFormField>
        <UFormField :label="$t('admin.products.form.sku')" name="sku">
          <UInput v-model="formState.sku" />
        </UFormField>
        <UFormField :label="$t('admin.products.form.description')" name="description">
          <UTextarea v-model="formState.description" />
        </UFormField>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField :label="$t('admin.products.form.price')" name="price">
            <UInputNumber v-model="formState.price" :min="0" />
          </UFormField>
          <UFormField :label="$t('admin.products.form.cost')" name="cost">
            <UInputNumber v-model="formState.cost" :min="0" />
          </UFormField>
        </div>
        <UFormField :label="$t('admin.products.form.pointsCost')" name="pointsCost">
          <UInputNumber v-model="formState.pointsCost" :min="0" />
        </UFormField>
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

  <UModal v-model:open="deleteOpen" :title="$t('admin.products.deleteTitle')" :ui="{ footer: 'justify-end' }">
    <template #body>
      <p class="text-sm text-stone-600">{{ $t('admin.products.deleteConfirm', { name: selected?.name || '' }) }}</p>
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
