<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { PaginationState } from '@tanstack/table-core'
import { useSelectedBranch } from '~/composables/useSelectedBranch'
import { useMeState } from '~/composables/useMe'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN', 'MANAGER'],
})

type BranchInfo = {
  id: string
  name: string
}

type Employee = {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'BARBER' | 'CLIENT'
  active: boolean
  createdAt: string
  updatedAt: string
  branches: { branch: BranchInfo }[]
}

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const { t } = useI18n()
const toast = useToast()

const me = useMeState()
const myRole = computed(() => me.value?.role)

const tableUi = useBackofficeTableUi()

const { branchOptions } = useSelectedBranch()

const employees = ref<Employee[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const modalOpen = ref(false)
const deleteOpen = ref(false)
const passwordOpen = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const isResetting = ref(false)
const selected = ref<Employee | null>(null)
const formRef = useTemplateRef('employeeForm')
const passwordFormRef = useTemplateRef('passwordForm')
const isEditing = computed(() => !!selected.value?.id)

const employeeBaseSchema = z.object({
  name: z.string().min(1, t('admin.employees.form.nameRequired')),
  email: z.string().email(t('admin.employees.form.emailInvalid')),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'BARBER', 'CLIENT']),
  active: z.boolean(),
  branchIds: z.array(z.string()).optional(),
  password: z.string().min(6).optional()
})

const employeeSchema = computed(() => employeeBaseSchema.superRefine((data, ctx) => {
  if (!isEditing.value && !data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['password'],
      message: t('admin.employees.form.passwordRequired')
    })
  }
}))

const passwordSchema = z.object({
  password: z.string().min(6, t('admin.employees.form.passwordRequired'))
})

type EmployeeForm = z.output<typeof employeeBaseSchema>
type PasswordForm = z.output<typeof passwordSchema>

const formState = reactive<Partial<EmployeeForm>>({
  name: '',
  email: '',
  role: 'BARBER',
  active: true,
  branchIds: [],
  password: ''
})

const passwordState = reactive<Partial<PasswordForm>>({
  password: ''
})

const branchItems = computed(() => branchOptions.value.map(branch => ({ label: branch.name, value: branch.id })))
const roleItems = computed(() => {
  const all = [
    { label: t('admin.employees.roles.owner'), value: 'OWNER' },
    { label: t('admin.employees.roles.admin'), value: 'ADMIN' },
    { label: t('admin.employees.roles.manager'), value: 'MANAGER' },
    { label: t('admin.employees.roles.barber'), value: 'BARBER' },
    { label: t('admin.employees.roles.client'), value: 'CLIENT' }
  ]

  // UX guard: only OWNER can create/promote to ADMIN/OWNER.
  if (myRole.value !== 'OWNER') {
    return all.filter(i => i.value !== 'ADMIN' && i.value !== 'OWNER')
  }

  return all
})

const tableRef = useTemplateRef('table')

const { search: globalFilter, sorted, sortBy, sortDir, toggleSort } = useCrudTable(employees, {
  search: (item, query) => {
    const q = query.toLowerCase()
    return [item.name, item.email, item.role].some(value => value.toLowerCase().includes(q))
  },
  initialSortBy: 'name',
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

const columns: TableColumn<Employee>[] = [
  {
    accessorKey: 'name',
    header: () => h('button', {
      class: 'text-left font-semibold',
      onClick: () => toggleSort('name')
    }, t('admin.employees.columns.name')),
    cell: ({ row }) => h('div', { class: 'space-y-0.5' }, [
      h('div', { class: 'text-sm font-medium text-stone-900' }, row.original.name),
      h('div', { class: 'text-xs text-stone-500' }, row.original.email)
    ])
  },
  {
    accessorKey: 'role',
    header: () => h('button', {
      class: 'text-left font-semibold',
      onClick: () => toggleSort('role')
    }, t('admin.employees.columns.role')),
    cell: ({ row }) => h(UBadge, { color: badgeColor(row.original.role), variant: 'subtle' }, () => t(`admin.employees.roles.${row.original.role.toLowerCase()}`))
  },
  {
    accessorKey: 'active',
    header: () => h('button', {
      class: 'text-left font-semibold',
      onClick: () => toggleSort('active')
    }, t('admin.employees.columns.active')),
    cell: ({ row }) => h(UBadge, { color: row.original.active ? 'success' : 'neutral', variant: 'subtle' }, () => row.original.active ? t('admin.common.active') : t('admin.common.inactive'))
  },
  {
    accessorKey: 'branches',
    header: t('admin.employees.columns.branches'),
    cell: ({ row }) => row.original.branches.length
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
    tr: (row: Row<Employee>) => row.original.id === selected.value?.id ? 'bg-amber-50/70' : ''
  }
}

const sortLabel = computed(() => sortBy.value ? `${sortBy.value}:${sortDir.value}` : '')
const hasData = computed(() => employees.value.length > 0)
const isEmpty = computed(() => !isLoading.value && !hasData.value && !errorMessage.value)

async function loadEmployees() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    employees.value = await $fetch('/api/employees')
  } catch (e: any) {
    employees.value = []
    errorMessage.value = e?.data?.statusMessage || t('admin.common.loadError')
  } finally {
    isLoading.value = false
  }
}

function badgeColor(role: Employee['role']) {
  if (role === 'OWNER') return 'warning'
  if (role === 'ADMIN') return 'primary'
  if (role === 'MANAGER') return 'info'
  return 'neutral'
}

function resetForm() {
  formState.name = ''
  formState.email = ''
  formState.role = 'BARBER'
  formState.active = true
  formState.branchIds = []
  formState.password = ''
}

function openCreate() {
  selected.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(employee: Employee) {
  selected.value = employee
  formState.name = employee.name
  formState.email = employee.email
  formState.role = employee.role
  formState.active = employee.active
  formState.branchIds = employee.branches.map(item => item.branch.id)
  formState.password = ''
  modalOpen.value = true
}

function requestDelete(employee: Employee) {
  selected.value = employee
  deleteOpen.value = true
}

function requestReset(employee: Employee) {
  selected.value = employee
  passwordState.password = ''
  passwordOpen.value = true
}

function getRowItems(row: Row<Employee>): DropdownMenuItem[][] {
  const items: DropdownMenuItem[] = [
    { label: t('admin.common.edit'), icon: 'i-lucide-pencil', onSelect: () => openEdit(row.original) },
    { label: t('admin.employees.resetPassword'), icon: 'i-lucide-key', onSelect: () => requestReset(row.original) }
  ]

  if (row.original.role !== 'OWNER') {
    items.push({ label: t('admin.common.delete'), icon: 'i-lucide-trash', color: 'error', onSelect: () => requestDelete(row.original) })
  }

  return [items]
}

async function saveEmployee(event: FormSubmitEvent<EmployeeForm>) {
  isSaving.value = true
  try {
    if (selected.value) {
      const { password, ...payload } = event.data
      await $fetch(`/api/employees/${selected.value.id}`, {
        method: 'PATCH',
        body: payload
      })
      toast.add({ title: t('admin.employees.toast.updated'), color: 'success' })
    } else {
      await $fetch('/api/employees', {
        method: 'POST',
        body: event.data
      })
      toast.add({ title: t('admin.employees.toast.created'), color: 'success' })
    }
    modalOpen.value = false
    await loadEmployees()
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
    await $fetch(`/api/employees/${selected.value.id}`, { method: 'DELETE' })
    toast.add({ title: t('admin.employees.toast.deleted'), color: 'success' })
    deleteOpen.value = false
    selected.value = null
    await loadEmployees()
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || t('admin.common.deleteError'), color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

async function confirmReset(event: FormSubmitEvent<PasswordForm>) {
  if (!selected.value) return
  isResetting.value = true
  try {
    await $fetch(`/api/employees/${selected.value.id}/password`, {
      method: 'PATCH',
      body: event.data
    })
    toast.add({ title: t('admin.employees.toast.passwordReset'), color: 'success' })
    passwordOpen.value = false
    passwordState.password = ''
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || t('admin.common.saveError'), color: 'error' })
  } finally {
    isResetting.value = false
  }
}

watch(modalOpen, (value) => {
  if (!value) {
    selected.value = null
    resetForm()
  }
})

onMounted(() => {
  void loadEmployees()
})
</script>

<template>
  <CrudTableShell
    :title="$t('pages.private.managerEmployees')"
    :search-placeholder="$t('admin.employees.searchPlaceholder')"
    :search-value="globalFilter"
    :is-loading="isLoading"
    :error-message="errorMessage"
    :can-create="true"
    :create-label="$t('admin.employees.new')"
    @search="globalFilter = $event"
    @create="openCreate"
  >
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
        :title="$t('admin.employees.emptyTitle')"
        :description="$t('admin.employees.emptyDescription')"
        icon="i-lucide-users"
        :action-label="$t('admin.employees.new')"
        @action="openCreate"
      />
    </div>

    <div v-else-if="errorMessage" class="p-6">
      <CrudState
        :title="$t('admin.common.errorTitle')"
        :description="errorMessage"
        icon="i-lucide-alert-triangle"
        :action-label="$t('admin.common.retry')"
        @action="loadEmployees"
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

  <UModal v-model:open="modalOpen" :title="isEditing ? $t('admin.employees.editTitle') : $t('admin.employees.newTitle')" :ui="{ footer: 'justify-end' }">
    <template #body>
      <UForm ref="employeeForm" :schema="employeeSchema" :state="formState" class="space-y-4" @submit="saveEmployee">
        <UFormField :label="$t('admin.employees.form.name')" name="name">
          <UInput v-model="formState.name" />
        </UFormField>
        <UFormField :label="$t('admin.employees.form.email')" name="email">
          <UInput v-model="formState.email" type="email" :disabled="isEditing" />
        </UFormField>
        <UFormField :label="$t('admin.employees.form.role')" name="role">
          <USelect v-model="formState.role" :items="roleItems" value-key="value" />
        </UFormField>
        <UFormField :label="$t('admin.employees.form.branches')" name="branchIds">
          <USelect v-model="formState.branchIds" :items="branchItems" value-key="value" multiple />
        </UFormField>
        <UFormField name="active">
          <UCheckbox v-model="formState.active" :label="$t('admin.employees.form.active')" />
        </UFormField>
        <UFormField v-if="!isEditing" :label="$t('admin.employees.form.password')" name="password">
          <UInput v-model="formState.password" type="password" />
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

  <UModal v-model:open="passwordOpen" :title="$t('admin.employees.resetTitle')" :ui="{ footer: 'justify-end' }">
    <template #body>
      <UForm ref="passwordForm" :schema="passwordSchema" :state="passwordState" class="space-y-4" @submit="confirmReset">
        <UFormField :label="$t('admin.employees.form.password')" name="password">
          <UInput v-model="passwordState.password" type="password" />
        </UFormField>
        <div class="hidden">
          <UButton type="submit" />
        </div>
      </UForm>
    </template>
    <template #footer>
      <UButton color="neutral" variant="outline" @click="passwordOpen = false">
        {{ $t('common.cancel') }}
      </UButton>
      <UButton color="primary" :loading="isResetting" @click="passwordFormRef?.submit()">
        {{ $t('admin.employees.resetPassword') }}
      </UButton>
    </template>
  </UModal>

  <UModal v-model:open="deleteOpen" :title="$t('admin.employees.deleteTitle')" :ui="{ footer: 'justify-end' }">
    <template #body>
      <p class="text-sm text-stone-600">{{ $t('admin.employees.deleteConfirm', { name: selected?.name || '' }) }}</p>
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
