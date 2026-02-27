<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { PaginationState } from '@tanstack/table-core'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN', 'MANAGER']
})

type Client = {
  id: string
  firstName: string
  lastName?: string | null
  email?: string | null
  phone?: string | null
  notes?: string | null
  pointsBalance?: number
  hasUser?: boolean
  createdAt: string
}

type ClientHistoryItem = {
  id: string
  startTime: string
  status: string
  services?: { service?: { name?: string } }[]
  professional?: { name?: string }
}

const { t } = useI18n()
const toast = useToast()
const tableUi = useBackofficeTableUi()

const clients = ref<Client[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const tableRef = useTemplateRef('table')
const { search: globalFilter, sorted } = useCrudTable(clients, {
  search: (item, query) => {
    const q = query.toLowerCase()
    const fullName = `${item.firstName} ${item.lastName || ''}`.toLowerCase()
    return (
      fullName.includes(q)
      || (item.email || '').toLowerCase().includes(q)
      || (item.phone || '').toLowerCase().includes(q)
    )
  },
  initialSortBy: 'createdAt',
  initialSortDir: 'desc'
})

const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 8 })
const page = computed({
  get: () => pagination.value.pageIndex + 1,
  set: (value: number) => {
    pagination.value.pageIndex = Math.max(0, value - 1)
  }
})
const pageSize = computed(() => pagination.value.pageSize)
const filteredTotal = computed(() => tableRef.value?.tableApi.getFilteredRowModel().rows.length ?? sorted.value.length)
const hasData = computed(() => clients.value.length > 0)
const isEmpty = computed(() => !isLoading.value && !errorMessage.value && clients.value.length === 0)

const modalOpen = ref(false)
const deleteOpen = ref(false)
const historyOpen = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const historyLoading = ref(false)
const historyRows = ref<ClientHistoryItem[]>([])
const selected = ref<Client | null>(null)
const historyClient = ref<Client | null>(null)
const formRef = ref<any>(null)

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional()
})

type ClientForm = z.output<typeof schema>

const formState = reactive<Partial<ClientForm>>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  notes: ''
})

const isEditing = computed(() => !!selected.value)

const columns: TableColumn<Client>[] = [
  { accessorKey: 'firstName', header: 'Nombre' },
  {
    id: 'lastName',
    header: 'Apellido',
    cell: ({ row }: any) => row.original.lastName || '—'
  },
  {
    id: 'email',
    header: 'Email',
    cell: ({ row }: any) => row.original.email || '—'
  },
  {
    id: 'phone',
    header: 'Teléfono',
    cell: ({ row }: any) => row.original.phone || '—'
  },
  {
    id: 'pointsBalance',
    header: 'Puntos',
    cell: ({ row }: any) => row.original.pointsBalance ?? 0
  },
  {
    id: 'hasUser',
    header: 'Usuario',
    cell: ({ row }: any) => row.original.hasUser ? 'Sí' : 'No'
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }: any) => {
      return h('div', { class: 'flex justify-end gap-2' }, [
        h(resolveComponent('UTooltip'), { text: 'Historial' }, {
          default: () => h(resolveComponent('UButton'), {
            size: 'xs',
            variant: 'outline',
            icon: 'i-lucide-history',
            'aria-label': 'Historial',
            onClick: () => openHistory(row.original)
          })
        }),
        h(resolveComponent('UTooltip'), { text: 'Editar' }, {
          default: () => h(resolveComponent('UButton'), {
            size: 'xs',
            variant: 'outline',
            icon: 'i-lucide-pencil',
            'aria-label': 'Editar',
            onClick: () => openEdit(row.original)
          })
        }),
        h(resolveComponent('UTooltip'), { text: 'Eliminar' }, {
          default: () => h(resolveComponent('UButton'), {
            size: 'xs',
            color: 'error',
            variant: 'outline',
            icon: 'i-lucide-trash-2',
            'aria-label': 'Eliminar',
            onClick: () => openDelete(row.original)
          })
        })
      ])
    }
  }
]

async function loadClients() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    clients.value = await $fetch('/api/clients')
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage || t('admin.common.errorTitle')
  } finally {
    isLoading.value = false
  }
}

function resetForm() {
  formState.firstName = ''
  formState.lastName = ''
  formState.email = ''
  formState.phone = ''
  formState.notes = ''
}

function openCreate() {
  selected.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(client: Client) {
  selected.value = client
  formState.firstName = client.firstName
  formState.lastName = client.lastName || ''
  formState.email = client.email || ''
  formState.phone = client.phone || ''
  formState.notes = client.notes || ''
  modalOpen.value = true
}

async function openHistory(client: Client) {
  historyClient.value = client
  historyRows.value = []
  historyOpen.value = true
  historyLoading.value = true
  try {
    historyRows.value = await $fetch(`/api/clients/${client.id}/history`)
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || 'No se pudo cargar historial', color: 'error' })
  } finally {
    historyLoading.value = false
  }
}

function openDelete(client: Client) {
  selected.value = client
  deleteOpen.value = true
}

async function saveClient(event: FormSubmitEvent<ClientForm>) {
  isSaving.value = true
  try {
    if (isEditing.value && selected.value) {
      await $fetch(`/api/clients/${selected.value.id}`, {
        method: 'PATCH',
        body: event.data
      })
    } else {
      await $fetch('/api/clients', {
        method: 'POST',
        body: event.data
      })
    }
    toast.add({ title: t('admin.common.saveSuccess'), color: 'success' })
    modalOpen.value = false
    await loadClients()
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
    await $fetch(`/api/clients/${selected.value.id}`, { method: 'DELETE' })
    toast.add({ title: t('admin.common.deleteSuccess'), color: 'success' })
    deleteOpen.value = false
    await loadClients()
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || t('admin.common.deleteError'), color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

onMounted(loadClients)
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-2xl font-semibold">Clientes</h1>
      <p class="text-sm text-stone-600">Gestioná clientes y visualizá sus puntos acumulados.</p>
    </div>

    <CrudTableShell
      title="Clientes"
      search-placeholder="Buscar por nombre, email o teléfono"
      :search-value="globalFilter"
      :is-loading="isLoading"
      :error-message="errorMessage"
      :can-create="true"
      create-label="Nuevo cliente"
      @search="globalFilter = $event"
      @create="openCreate"
    >
      <div v-if="isLoading && !hasData" class="p-6">
        <USkeleton class="h-8 w-full" />
        <USkeleton class="mt-3 h-8 w-full" />
      </div>
      <div v-else-if="isEmpty" class="p-6 text-sm text-stone-500">Sin clientes.</div>
      <div v-else-if="errorMessage" class="p-4 text-sm text-red-600">{{ errorMessage }}</div>
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

    <UModal v-model:open="modalOpen" :title="isEditing ? 'Editar cliente' : 'Nuevo cliente'" :ui="{ footer: 'justify-end' }">
      <template #body>
        <UForm ref="formRef" :schema="schema" :state="formState" class="space-y-3" @submit="saveClient">
          <UFormField label="Nombre" name="firstName">
            <UInput v-model="formState.firstName" />
          </UFormField>
          <UFormField label="Apellido" name="lastName">
            <UInput v-model="formState.lastName" />
          </UFormField>
          <UFormField label="Email" name="email">
            <UInput v-model="formState.email" />
          </UFormField>
          <UFormField label="Teléfono" name="phone">
            <UInput v-model="formState.phone" />
          </UFormField>
          <UFormField label="Notas" name="notes">
            <UTextarea v-model="formState.notes" />
          </UFormField>
          <div class="hidden"><UButton type="submit" /></div>
        </UForm>
      </template>
      <template #footer>
        <UButton variant="outline" @click="modalOpen = false">Cancelar</UButton>
        <UButton color="primary" :loading="isSaving" @click="formRef?.submit()">Guardar</UButton>
      </template>
    </UModal>

    <UModal v-model:open="historyOpen" :title="`Historial · ${historyClient?.firstName || ''}`" :ui="{ footer: 'justify-end' }">
      <template #body>
        <div v-if="historyLoading" class="space-y-2">
          <USkeleton class="h-8 w-full" />
          <USkeleton class="h-8 w-full" />
        </div>
        <div v-else-if="!historyRows.length" class="text-sm text-stone-500">Sin historial de turnos.</div>
        <div v-else class="max-h-[55vh] overflow-auto space-y-2">
          <div v-for="row in historyRows" :key="row.id" class="rounded border border-stone-200 p-3">
            <div class="text-sm font-medium text-stone-900">{{ new Date(row.startTime).toLocaleString('es-AR') }}</div>
            <div class="text-xs text-stone-500">Estado: {{ row.status }}</div>
            <div class="text-xs text-stone-500">Profesional: {{ row.professional?.name || '—' }}</div>
            <div class="text-xs text-stone-600">
              Servicios: {{ (row.services || []).map(s => s.service?.name).filter(Boolean).join(', ') || '—' }}
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <UButton variant="outline" @click="historyOpen = false">Cerrar</UButton>
      </template>
    </UModal>

    <UModal v-model:open="deleteOpen" title="Eliminar cliente" :ui="{ footer: 'justify-end' }">
      <template #body>
        <p class="text-sm text-stone-600">¿Seguro que querés eliminar este cliente?</p>
      </template>
      <template #footer>
        <UButton variant="outline" @click="deleteOpen = false">Cancelar</UButton>
        <UButton color="error" :loading="isDeleting" @click="confirmDelete">Eliminar</UButton>
      </template>
    </UModal>
  </div>
</template>
