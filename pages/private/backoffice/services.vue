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

type Service = {
  id: string
  name: string
  description: string | null
  price: string
  duration: number
  active: boolean
  createdAt: string
  updatedAt: string
}

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()
const { t } = useI18n()

const services = ref<Service[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const modalOpen = ref(false)
const deleteOpen = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const selected = ref<Service | null>(null)
const formRef = useTemplateRef('serviceForm')

const serviceSchema = z.object({
  name: z.string().min(1, t('admin.services.form.nameRequired')),
  description: z.string().optional().nullable(),
  price: z.number().positive(),
  duration: z.number().int().positive(),
})

type ServiceForm = z.output<typeof serviceSchema>

const formState = reactive<Partial<ServiceForm>>({
  name: '',
  description: '',
  price: 0,
  duration: 30,
})

const tableRef = useTemplateRef('table')

const { search: globalFilter, sorted, sortBy, sortDir, toggleSort } = useCrudTable(services, {
  search: (item, query) => {
    const q = query.toLowerCase()
    return [item.name, item.description].filter(Boolean).some(value => value!.toLowerCase().includes(q))
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

const columns: TableColumn<Service>[] = [
  {
    accessorKey: 'name',
    header: () => h('button', {
      class: 'text-left font-semibold',
      onClick: () => toggleSort('name')
    }, t('admin.services.columns.name')),
    cell: ({ row }) => h('div', { class: 'space-y-0.5' }, [
      h('div', { class: 'text-sm font-medium text-stone-900' }, row.original.name),
      row.original.description
        ? h('div', { class: 'text-xs text-stone-500 line-clamp-1' }, row.original.description)
        : null
    ])
  },
  {
    accessorKey: 'duration',
    header: () => h('button', {
      class: 'text-right font-semibold w-full',
      onClick: () => toggleSort('duration')
    }, t('admin.services.columns.duration')),
    cell: ({ row }) => `${row.original.duration} min`,
    meta: { class: { td: 'text-right', th: 'text-right' } }
  },
  {
    accessorKey: 'price',
    header: () => h('button', {
      class: 'text-right font-semibold w-full',
      onClick: () => toggleSort('price')
    }, t('admin.services.columns.price')),
    cell: ({ row }) => formatCurrency(row.original.price),
    meta: { class: { td: 'text-right', th: 'text-right' } }
  },
  {
    accessorKey: 'updatedAt',
    header: () => h('button', {
      class: 'text-left font-semibold',
      onClick: () => toggleSort('updatedAt')
    }, t('admin.services.columns.updatedAt')),
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
    tr: (row: Row<Service>) => row.original.id === selected.value?.id ? 'bg-amber-50/70' : ''
  }
}

const isEditing = computed(() => !!selected.value?.id)
const sortLabel = computed(() => sortBy.value ? `${sortBy.value}:${sortDir.value}` : '')
const hasData = computed(() => services.value.length > 0)
const isEmpty = computed(() => !isLoading.value && !hasData.value && !errorMessage.value)

function resetForm() {
  formState.name = ''
  formState.description = ''
  formState.price = 0
  formState.duration = 30
}

function openCreate() {
  selected.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(item: Service) {
  selected.value = item
  formState.name = item.name
  formState.description = item.description || ''
  formState.price = Number(item.price)
  formState.duration = Number(item.duration)
  modalOpen.value = true
}

function openDelete(item: Service) {
  selected.value = item
  deleteOpen.value = true
}

function getRowItems(row: Row<Service>): DropdownMenuItem[][] {
  return [[
    {
      label: t('admin.common.edit'),
      icon: 'i-lucide-pencil',
      onSelect: () => openEdit(row.original)
    },
    {
      label: t('admin.common.delete'),
      icon: 'i-lucide-trash',
      onSelect: () => openDelete(row.original)
    }
  ]]
}

async function loadServices() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    services.value = await $fetch('/api/services')
  } catch (e: any) {
    services.value = []
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

async function saveService(event: FormSubmitEvent<ServiceForm>) {
  isSaving.value = true
  try {
    const payload = event.data

    if (selected.value) {
      await $fetch(`/api/services/${selected.value.id}`, {
        method: 'PATCH',
        body: payload
      })
      toast.add({ title: t('admin.services.toast.updated'), color: 'success' })
    } else {
      await $fetch('/api/services', {
        method: 'POST',
        body: payload
      })
      toast.add({ title: t('admin.services.toast.created'), color: 'success' })
    }

    modalOpen.value = false
    selected.value = null
    await loadServices()
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
    await $fetch(`/api/services/${selected.value.id}`, { method: 'DELETE' })
    toast.add({ title: t('admin.services.toast.deleted'), color: 'success' })
    deleteOpen.value = false
    selected.value = null
    await loadServices()
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || t('admin.common.deleteError'), color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

watch(modalOpen, (value) => {
  if (!value) {
    selected.value = null
    resetForm()
  }
})

onMounted(() => {
  void loadServices()
})
</script>

<template>
  <CrudTableShell
    :title="$t('pages.private.managerServices')"
    :search-placeholder="$t('admin.services.searchPlaceholder')"
    :search-value="globalFilter"
    :is-loading="isLoading"
    :error-message="errorMessage"
    :can-create="true"
    :create-label="$t('admin.services.new')"
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
        :title="$t('admin.services.emptyTitle')"
        :description="$t('admin.services.emptyDescription')"
        icon="i-lucide-scissors"
        :action-label="$t('admin.services.new')"
        @action="openCreate"
      />
    </div>

    <div v-else-if="errorMessage" class="p-6">
      <CrudState
        :title="$t('admin.common.errorTitle')"
        :description="errorMessage"
        icon="i-lucide-alert-triangle"
        :action-label="$t('admin.common.retry')"
        @action="loadServices"
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

  <UModal v-model:open="modalOpen" :title="isEditing ? $t('admin.services.editTitle') : $t('admin.services.newTitle')" :ui="{ footer: 'justify-end' }">
    <template #body>
      <UForm ref="serviceForm" :schema="serviceSchema" :state="formState" class="space-y-4" @submit="saveService">
        <UFormField :label="$t('admin.services.form.name')" name="name">
          <UInput v-model="formState.name" />
        </UFormField>
        <UFormField :label="$t('admin.services.form.description')" name="description">
          <UTextarea v-model="formState.description" />
        </UFormField>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField :label="$t('admin.services.form.duration')" name="duration">
            <UInputNumber v-model="formState.duration" :min="1" />
          </UFormField>
          <UFormField :label="$t('admin.services.form.price')" name="price">
            <UInputNumber v-model="formState.price" :min="1" />
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

  <UModal v-model:open="deleteOpen" :title="$t('admin.services.deleteTitle')" :ui="{ footer: 'justify-end' }">
    <template #body>
      <p class="text-sm text-stone-600">{{ $t('admin.services.deleteConfirm', { name: selected?.name || '' }) }}</p>
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
