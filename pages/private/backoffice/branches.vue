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
  roles: ['OWNER'],
})

type Branch = {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  createdAt: string
  updatedAt: string
}

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const { t, locale } = useI18n()
const toast = useToast()

const tableUi = useBackofficeTableUi()

const branches = ref<Branch[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const modalOpen = ref(false)
const deleteOpen = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const selected = ref<Branch | null>(null)
const formRef = useTemplateRef('branchForm')

const branchSchema = z.object({
  name: z.string().min(1, t('admin.branches.form.nameRequired')),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable()
})

type BranchForm = z.output<typeof branchSchema>

const formState = reactive<Partial<BranchForm>>({
  name: '',
  address: '',
  phone: ''
})

const tableRef = useTemplateRef('table')

const { search: globalFilter, sorted, sortBy, sortDir, toggleSort } = useCrudTable(branches, {
  search: (item, query) => {
    const q = query.toLowerCase()
    return [item.name, item.address, item.phone].filter(Boolean).some(value => value!.toLowerCase().includes(q))
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

const columns: TableColumn<Branch>[] = [
  {
    accessorKey: 'name',
    header: () => h('button', {
      class: 'text-left font-semibold',
      onClick: () => toggleSort('name')
    }, t('admin.branches.columns.name'))
  },
  {
    accessorKey: 'address',
    header: () => h('button', {
      class: 'text-left font-semibold',
      onClick: () => toggleSort('address')
    }, t('admin.branches.columns.address')),
    cell: ({ row }) => row.original.address || '—'
  },
  {
    accessorKey: 'phone',
    header: () => h('button', {
      class: 'text-left font-semibold',
      onClick: () => toggleSort('phone')
    }, t('admin.branches.columns.phone')),
    cell: ({ row }) => row.original.phone || '—'
  },
  {
    accessorKey: 'updatedAt',
    header: () => h('button', {
      class: 'text-left font-semibold',
      onClick: () => toggleSort('updatedAt')
    }, t('admin.branches.columns.updatedAt')),
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
    tr: (row: Row<Branch>) => row.original.id === selected.value?.id ? 'bg-amber-50/70' : ''
  }
}

const isEditing = computed(() => !!selected.value?.id)
const sortLabel = computed(() => sortBy.value ? `${sortBy.value}:${sortDir.value}` : '')
const hasData = computed(() => branches.value.length > 0)
const isEmpty = computed(() => !isLoading.value && !hasData.value && !errorMessage.value)

function formatDate(value: string) {
  return new Date(value).toLocaleString(locale.value === 'es-AR' ? 'es-AR' : 'en-US', { year: 'numeric', month: 'short', day: '2-digit' })
}

async function loadBranches() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    branches.value = await $fetch('/api/branches')
  } catch (e: any) {
    branches.value = []
    errorMessage.value = e?.data?.statusMessage || t('admin.common.loadError')
  } finally {
    isLoading.value = false
  }
}

function resetForm() {
  formState.name = ''
  formState.address = ''
  formState.phone = ''
}

function openCreate() {
  selected.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(branch: Branch) {
  selected.value = branch
  formState.name = branch.name
  formState.address = branch.address || ''
  formState.phone = branch.phone || ''
  modalOpen.value = true
}

function requestDelete(branch: Branch) {
  selected.value = branch
  deleteOpen.value = true
}

function getRowItems(row: Row<Branch>): DropdownMenuItem[][] {
  return [
    [
      { label: t('admin.common.edit'), icon: 'i-lucide-pencil', onSelect: () => openEdit(row.original) },
      { label: t('admin.common.delete'), icon: 'i-lucide-trash', color: 'error', onSelect: () => requestDelete(row.original) }
    ]
  ]
}

async function saveBranch(event: FormSubmitEvent<BranchForm>) {
  isSaving.value = true
  try {
    if (selected.value) {
      await $fetch(`/api/branches/${selected.value.id}`, {
        method: 'PATCH',
        body: event.data
      })
      toast.add({ title: t('admin.branches.toast.updated'), color: 'success' })
    } else {
      await $fetch('/api/branches', {
        method: 'POST',
        body: event.data
      })
      toast.add({ title: t('admin.branches.toast.created'), color: 'success' })
    }
    modalOpen.value = false
    await loadBranches()
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
    await $fetch(`/api/branches/${selected.value.id}`, { method: 'DELETE' })
    toast.add({ title: t('admin.branches.toast.deleted'), color: 'success' })
    deleteOpen.value = false
    selected.value = null
    await loadBranches()
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
  void loadBranches()
})
</script>

<template>
  <CrudTableShell
    :title="$t('pages.private.managerBranches')"
    :search-placeholder="$t('admin.branches.searchPlaceholder')"
    :search-value="globalFilter"
    :is-loading="isLoading"
    :error-message="errorMessage"
    :can-create="true"
    :create-label="$t('admin.branches.new')"
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
        :title="$t('admin.branches.emptyTitle')"
        :description="$t('admin.branches.emptyDescription')"
        icon="i-lucide-map-pin"
        :action-label="$t('admin.branches.new')"
        @action="openCreate"
      />
    </div>

    <div v-else-if="errorMessage" class="p-6">
      <CrudState
        :title="$t('admin.common.errorTitle')"
        :description="errorMessage"
        icon="i-lucide-alert-triangle"
        :action-label="$t('admin.common.retry')"
        @action="loadBranches"
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
        :ui="tableUi"
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

  <UModal v-model:open="modalOpen" :title="isEditing ? $t('admin.branches.editTitle') : $t('admin.branches.newTitle')" :ui="{ footer: 'justify-end' }">
    <template #body>
      <UForm ref="branchForm" :schema="branchSchema" :state="formState" class="space-y-4" @submit="saveBranch">
        <UFormField :label="$t('admin.branches.form.name')" name="name">
          <UInput v-model="formState.name" />
        </UFormField>
        <UFormField :label="$t('admin.branches.form.address')" name="address">
          <UInput v-model="formState.address" />
        </UFormField>
        <UFormField :label="$t('admin.branches.form.phone')" name="phone">
          <UInput v-model="formState.phone" />
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

  <UModal v-model:open="deleteOpen" :title="$t('admin.branches.deleteTitle')" :ui="{ footer: 'justify-end' }">
    <template #body>
      <p class="text-sm text-stone-600">{{ $t('admin.branches.deleteConfirm', { name: selected?.name || '' }) }}</p>
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
