<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  branchId: string
  initialStart?: string | null
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const toast = useToast()
const { t } = useI18n()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'FINISHED' | 'PAID' | 'CANCELED' | 'NO_SHOW'

type Client = {
  id: string
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  phone?: string | null
}

type Service = {
  id: string
  name?: string | null
  duration?: number | null
  active?: boolean | null
}

type Professional = {
  id: string
  name?: string | null
  email?: string | null
}

type SelectItem = {
  id: string
  label: string
}

// Data
const clients = ref<Client[]>([])
const services = ref<Service[]>([])
const barbers = ref<Professional[]>([])
const loading = ref(false)

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function normalizeClientItems(rows: Client[]): SelectItem[] {
  return rows
    .filter((c) => typeof c?.id === 'string' && c.id.length > 0)
    .map((c) => {
      const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ').trim()
      return {
        id: c.id,
        label: fullName || c.email || c.phone || `Cliente ${c.id.slice(0, 6)}`
      }
    })
}

function normalizeProfessionalItems(rows: Professional[]): SelectItem[] {
  return rows
    .filter((p) => typeof p?.id === 'string' && p.id.length > 0)
    .map((p) => ({
      id: p.id,
      label: p.name || p.email || `Profesional ${p.id.slice(0, 6)}`
    }))
}

function normalizeServiceItems(rows: Service[]): SelectItem[] {
  return rows
    .filter((s) => typeof s?.id === 'string' && s.id.length > 0)
    .map((s) => ({
      id: s.id,
      label: s.name || `Servicio ${s.id.slice(0, 6)}`
    }))
}

const clientItems = computed(() => normalizeClientItems(clients.value))
const professionalItems = computed(() => normalizeProfessionalItems(barbers.value))
const serviceItems = computed(() => normalizeServiceItems(services.value))

// Form
const form = reactive({
  clientId: '',
  professionalId: '',
  serviceIds: [] as string[],
  date: new Date().toISOString().split('T')[0],
  time: '10:00',
  duration: 30, // Default duration
  status: 'CONFIRMED' as AppointmentStatus,
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

    clients.value = asArray<Client>(clientsData)
    services.value = asArray<Service>(servicesData).filter((s) => s?.active !== false)
    barbers.value = asArray<Professional>(barbersData)
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

    const preset = props.initialStart ? new Date(props.initialStart) : null
    if (preset && !Number.isNaN(preset.getTime())) {
      form.date = preset.toISOString().split('T')[0]
      form.time = `${String(preset.getHours()).padStart(2, '0')}:${String(preset.getMinutes()).padStart(2, '0')}`
    } else {
      form.date = new Date().toISOString().split('T')[0]
      form.time = '10:00'
    }

    form.status = 'CONFIRMED'
    form.notes = ''
    form.duration = 30
    isQuickAddClient.value = false
  }
})

// Watch services to update duration
watch(() => form.serviceIds, (ids) => {
  const selectedServices = services.value.filter((s) => ids.includes(s.id))
  const totalDuration = selectedServices.reduce((acc, s) => acc + (Number(s.duration) || 0), 0)
  if (totalDuration > 0) {
    form.duration = totalDuration
  }
})

// Actions
async function createClient() {
  if (!newClient.firstName) return
  try {
    const created = await $fetch<Client>('/api/clients', {
      method: 'POST',
      body: newClient
    })
    if (created?.id) {
      clients.value.push(created) // Optimistic update
      form.clientId = created.id
    }
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
  <UModal v-model:open="isOpen" :title="'Nuevo Turno'" :ui="{ width: 'sm:max-w-2xl' }">
    <template #body>
      <div class="space-y-4">
        <!-- Client Selection -->
        <div v-if="!isQuickAddClient">
          <UFormGroup label="Cliente" required>
            <div class="flex gap-2">
              <USelectMenu
                v-model="form.clientId"
                :items="clientItems"
                value-key="id"
                label-key="label"
                searchable
                searchable-placeholder="Buscar cliente..."
                placeholder="Seleccionar cliente"
                class="flex-1"
              />
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
            :items="professionalItems"
            value-key="id"
            label-key="label"
            placeholder="Seleccionar profesional"
          />
        </UFormGroup>

        <!-- Services -->
        <UFormGroup label="Servicios" required>
          <USelectMenu
            v-model="form.serviceIds"
            :items="serviceItems"
            value-key="id"
            label-key="label"
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
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" @click="isOpen = false">Cancelar</UButton>
        <UButton color="primary" @click="submit" :loading="loading">Crear Turno</UButton>
      </div>
    </template>
  </UModal>
</template>
