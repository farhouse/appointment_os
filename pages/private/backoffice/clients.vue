<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

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
  createdAt: string
}

const { t } = useI18n()
const toast = useToast()

const clients = ref<Client[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const search = ref('')

const modalOpen = ref(false)
const deleteOpen = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const selected = ref<Client | null>(null)
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

const rows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return clients.value
  return clients.value.filter(c => {
    const fullName = `${c.firstName} ${c.lastName || ''}`.toLowerCase()
    return (
      fullName.includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    )
  })
})

const columns = [
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
    id: 'actions',
    header: '',
    cell: ({ row }: any) => {
      return h('div', { class: 'flex justify-end gap-2' }, [
        h(resolveComponent('UButton'), {
          size: 'xs',
          variant: 'outline',
          onClick: () => openEdit(row.original)
        }, () => 'Editar'),
        h(resolveComponent('UButton'), {
          size: 'xs',
          color: 'error',
          variant: 'outline',
          onClick: () => openDelete(row.original)
        }, () => 'Eliminar')
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
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold">Clientes</h1>
        <p class="text-sm text-stone-600">Gestioná clientes y visualizá sus puntos acumulados.</p>
      </div>
      <UButton color="primary" @click="openCreate">Nuevo cliente</UButton>
    </div>

    <div class="rounded-lg border border-stone-200 bg-white shadow-sm">
      <div class="border-b border-stone-200 p-3">
        <UInput v-model="search" placeholder="Buscar por nombre, email o teléfono" />
      </div>

      <div v-if="isLoading" class="p-4">
        <USkeleton class="h-8 w-full" />
        <USkeleton class="mt-3 h-8 w-full" />
      </div>
      <div v-else-if="errorMessage" class="p-4 text-sm text-red-600">{{ errorMessage }}</div>
      <div v-else-if="!rows.length" class="p-4 text-sm text-stone-500">Sin clientes.</div>
      <div v-else>
        <UTable :data="rows" :columns="columns" />
      </div>
    </div>

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
