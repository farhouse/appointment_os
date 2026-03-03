<script setup lang="ts">
import { z } from 'zod'

const props = defineProps<{
  modelValue: boolean
  branchId: string
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const toast = useToast()
const { t } = useI18n()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Data
const clients = ref<any[]>([])
const services = ref<any[]>([])
const barbers = ref<any[]>([])
const loading = ref(false)

// Form
const form = reactive({
  clientId: '',
  professionalId: '',
  serviceIds: [] as string[],
  date: new Date().toISOString().split('T')[0],
  time: '10:00',
  duration: 30, // Default duration
  status: 'CONFIRMED' as 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'FINISHED' | 'PAID' | 'CANCELED' | 'NO_SHOW',
  notes: ''
})

const isQuickAddClient = ref(false)
const newClient = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  notes: ''
})

// Fetch Data
async function fetchData() {
  loading.value = true
  try {
    const [clientsData, servicesData, barbersData] = await Promise.all([
      $fetch('/api/clients'),
      $fetch('/api/services'),
      $fetch(`/api/public/barbers?branchId=${props.branchId}`)
    ])
    clients.value = clientsData as any[]
    services.value = (servicesData as any[]).filter((s: any) => s.active)
    barbers.value = barbersData as any[]
  } catch (e) {
    toast.add({ title: 'Error loading data', color: 'red' })
  } finally {
    loading.value = false
  }
}

watch(isOpen, (val) => {
  if (val) {
    fetchData()
    // Reset form
    form.clientId = ''
    form.professionalId = ''
    form.serviceIds = []
    form.date = new Date().toISOString().split('T')[0]
    form.time: '10:00'
    form.status = 'CONFIRMED'
    form.notes = ''
    form.duration = 30
    isQuickAddClient.value = false
  }
})

// Watch services to update duration
watch(() => form.serviceIds, (ids) => {
  const selectedServices = services.value.filter(s => ids.includes(s.id))
  const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0)
  if (totalDuration > 0) {
    form.duration = totalDuration
  }
})

// Actions
async function createClient() {
  if (!newClient.firstName) return
  try {
    const created = await $fetch('/api/clients', {
      method: 'POST',
      body: newClient
    })
    clients.value.push(created) // Optimistic update
    form.clientId = (created as any).id
    isQuickAddClient.value = false
    toast.add({ title: 'Cliente creado', color: 'green' })
    // Reset new client form
    newClient.firstName = ''
    newClient.lastName = ''
    newClient.email = ''
    newClient.phone = ''
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || 'Error creando cliente', color: 'red' })
  }
}

async function submit() {
  if (!form.clientId || !form.serviceIds.length || !form.date || !form.time) {
    toast.add({ title: 'Completá los campos obligatorios', color: 'orange' })
    return
  }

  // Construct start/end time
  const startDateTime = new Date(`${form.date}T${form.time}:00`)
  const endDateTime = new Date(startDateTime.getTime() + form.duration * 60000)

  const body = {
    branchId: props.branchId,
    clientId: form.clientId,
    professionalId: form.professionalId || undefined,
    serviceIds: form.serviceIds,
    startTime: startDateTime.toISOString(),
    endTime: endDateTime.toISOString(),
    status: form.status,
    notes: form.notes
  }

  try {
    await $fetch('/api/appointments', {
      method: 'POST',
      body
    })
    toast.add({ title: 'Turno creado', color: 'green' })
    isOpen.value = false
    emit('success')
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || 'Error creando turno', color: 'red' })
  }
}
</script>

<template>
  <UModal v-model="isOpen">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100' }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold leading-6 text-gray-900">
            Nuevo Turno
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isOpen = false" />
        </div>
      </template>

      <div class="space-y-4">
        <!-- Client Selection -->
        <div v-if="!isQuickAddClient">
          <UFormGroup label="Cliente" required>
            <div class="flex gap-2">
              <USelectMenu
                v-model="form.clientId"
                :options="clients"
                option-attribute="firstName"
                value-attribute="id"
                searchable
                searchable-placeholder="Buscar cliente..."
                placeholder="Seleccionar cliente"
                class="flex-1"
              >
                <template #option="{ option }">
                  <span class="truncate">{{ option.firstName }} {{ option.lastName }}</span>
                  <span v-if="option.email || option.phone" class="text-xs text-gray-500 ml-1">
                    ({{ option.email || option.phone }})
                  </span>
                </template>
                <template #label>
                  <span v-if="form.clientId">
                    {{ clients.find(c => c.id === form.clientId)?.firstName }} {{ clients.find(c => c.id === form.clientId)?.lastName }}
                  </span>
                  <span v-else class="text-gray-500">Seleccionar cliente</span>
                </template>
              </USelectMenu>
              <UButton icon="i-heroicons-plus" color="gray" variant="solid" @click="isQuickAddClient = true" />
            </div>
          </UFormGroup>
        </div>

        <!-- Quick Add Client Form -->
        <div v-else class="p-3 border rounded bg-gray-50 space-y-3">
          <div class="flex justify-between items-center">
            <h4 class="text-sm font-medium">Nuevo Cliente</h4>
            <UButton size="xs" color="gray" variant="ghost" @click="isQuickAddClient = false">Cancelar</UButton>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <UInput v-model="newClient.firstName" placeholder="Nombre *" />
            <UInput v-model="newClient.lastName" placeholder="Apellido" />
            <UInput v-model="newClient.email" placeholder="Email" />
            <UInput v-model="newClient.phone" placeholder="Teléfono" />
          </div>
          <UButton size="sm" block @click="createClient">Guardar Cliente</UButton>
        </div>

        <!-- Professional -->
        <UFormGroup label="Barbero / Profesional" required>
          <USelectMenu
            v-model="form.professionalId"
            :options="barbers"
            option-attribute="name"
            value-attribute="id"
            placeholder="Seleccionar profesional"
          />
        </UFormGroup>

        <!-- Services -->
        <UFormGroup label="Servicios" required>
          <USelectMenu
            v-model="form.serviceIds"
            :options="services"
            option-attribute="name"
            value-attribute="id"
            multiple
            placeholder="Seleccionar servicios"
          />
        </UFormGroup>

        <!-- Date & Time -->
        <div class="grid grid-cols-2 gap-4">
          <UFormGroup label="Fecha" required>
            <UInput type="date" v-model="form.date" />
          </UFormGroup>
          <UFormGroup label="Hora" required>
            <UInput type="time" v-model="form.time" />
          </UFormGroup>
        </div>

        <!-- Duration & Status -->
        <div class="grid grid-cols-2 gap-4">
          <UFormGroup label="Duración (min)" required>
            <UInput type="number" v-model.number="form.duration" min="5" step="5" />
          </UFormGroup>
          <UFormGroup label="Estado Inicial">
            <USelect v-model="form.status" :options="['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'FINISHED', 'PAID']" />
          </UFormGroup>
        </div>
        
        <!-- Notes -->
        <UFormGroup label="Notas">
          <UTextarea v-model="form.notes" />
        </UFormGroup>

      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="ghost" @click="isOpen = false">Cancelar</UButton>
          <UButton color="primary" @click="submit" :loading="loading">Crear Turno</UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
