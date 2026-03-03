<script setup lang="ts">
import { z } from 'zod'

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN', 'MANAGER'],
})

const { selectedBranchId } = useSelectedBranch()
const toast = useToast()
const { t } = useI18n()

// Data
const sales = ref<any[]>([])
const loading = ref(false)
const products = ref<any[]>([])
const services = ref<any[]>([])
const cashBoxes = ref<any[]>([])
const paymentMedia = ref<any[]>([])

// Filters
const dateFrom = ref(new Date().toISOString().split('T')[0])
const dateTo = ref(new Date().toISOString().split('T')[0])

// New Sale Form
const isNewSaleOpen = ref(false)
const saleForm = reactive({
  items: [] as Array<{
    type: 'PRODUCT' | 'SERVICE' | 'CONCEPT'
    productId?: string
    serviceId?: string
    name: string
    quantity: number
    price: number
  }>,
  paymentMethod: 'CASH',
  paymentMediumId: '',
  cashBoxId: '',
  notes: ''
})

// Fetch Sales
async function fetchSales() {
  if (!selectedBranchId.value) return
  loading.value = true
  try {
    const query = new URLSearchParams({
      branchId: selectedBranchId.value,
      from: dateFrom.value,
      to: dateTo.value
    })
    sales.value = await $fetch(`/api/sales?${query.toString()}`)
  } catch (e) {
    sales.value = []
  } finally {
    loading.value = false
  }
}

// Fetch dependencies for form
async function loadFormDependencies() {
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

watch(selectedBranchId, () => {
  fetchSales()
  loadFormDependencies()
})

watch([dateFrom, dateTo], () => {
  fetchSales()
})

onMounted(() => {
  if (selectedBranchId.value) {
    fetchSales()
  }
  loadFormDependencies()
})

// Form Logic
const total = computed(() => {
  return saleForm.items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
})

const cashBoxOptions = computed(() => cashBoxes.value.map((c: any) => ({ label: c.name, value: c.id })))
const payMediaOptions = computed(() =>
  paymentMedia.value
    .filter((m: any) => m.method === saleForm.paymentMethod)
    .map((m: any) => ({ label: m.name, value: m.id }))
)

watch(() => saleForm.paymentMethod, (method) => {
  const first = paymentMedia.value.find(m => m.active && m.method === method)
  saleForm.paymentMediumId = first?.id || ''
})

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

async function openNewSale() {
  await loadFormDependencies()
  // Reset form
  saleForm.items = []
  addItem()
  saleForm.paymentMethod = 'CASH'
  saleForm.paymentMediumId = ''
  saleForm.cashBoxId = ''
  saleForm.notes = ''
  isNewSaleOpen.value = true
}

// Helper to update item details when product/service changes
function onItemChange(item: any) {
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

async function submitSale() {
  if (!saleForm.items.length) return
  if (!saleForm.cashBoxId) {
    toast.add({ title: 'Seleccioná una caja', color: 'orange' })
    return
  }
  if (!saleForm.paymentMediumId) {
    toast.add({ title: 'Seleccioná un medio de pago', color: 'orange' })
    return
  }

  // Verify open session
  try {
    const session = await $fetch(`/api/cash/sessions/current?branchId=${selectedBranchId.value}&cashBoxId=${saleForm.cashBoxId}`)
    if (!session) {
      toast.add({ title: 'Abrí caja primero', color: 'red' })
      return
    }
  } catch {
    return
  }

  const body = {
    branchId: selectedBranchId.value,
    items: saleForm.items.map(i => ({
      productId: i.type === 'PRODUCT' ? i.productId : undefined,
      serviceId: i.type === 'SERVICE' ? i.serviceId : undefined,
      name: i.name,
      quantity: i.quantity,
      price: i.price
    })),
    total: total.value,
    paymentMethod: saleForm.paymentMethod,
    paymentMediumId: saleForm.paymentMediumId
  }

  try {
    await $fetch('/api/sales', {
      method: 'POST',
      body
    })
    toast.add({ title: 'Venta registrada', color: 'green' })
    isNewSaleOpen.value = false
    fetchSales()
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || 'Error al guardar venta', color: 'red' })
  }
}
</script>

<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold">Ventas</h1>
      <UButton icon="i-heroicons-plus" color="primary" @click="openNewSale">Nueva Venta</UButton>
    </div>

    <!-- Filters -->
    <div class="flex gap-4 mb-6 bg-white p-4 rounded-lg shadow items-end">
      <UFormGroup label="Desde">
        <UInput type="date" v-model="dateFrom" />
      </UFormGroup>
      <UFormGroup label="Hasta">
        <UInput type="date" v-model="dateTo" />
      </UFormGroup>
    </div>

    <!-- List -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ítems</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="sale in sales" :key="sale.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ new Date(sale.createdAt).toLocaleString() }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
              <ul>
                <li v-for="item in sale.items" :key="item.id">
                  {{ item.quantity }}x {{ item.name }}
                </li>
              </ul>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
              ${{ sale.total }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ sale.paymentMethod }}
            </td>
          </tr>
          <tr v-if="!sales.length">
            <td colspan="4" class="px-6 py-4 text-center text-gray-500">No hay ventas en este período</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- New Sale Modal -->
    <UModal v-model="isNewSaleOpen" :ui="{ width: 'sm:max-w-4xl' }">
      <UCard class="bg-white text-stone-900">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Nueva Venta</h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" @click="isNewSaleOpen = false" />
          </div>
        </template>

        <div class="space-y-4">
          <!-- Items -->
          <div class="space-y-2">
            <div v-for="(item, index) in saleForm.items" :key="index" class="flex gap-2 items-start border p-2 rounded">
              <div class="w-32">
                <USelect v-model="item.type" :items="['PRODUCT', 'SERVICE', 'CONCEPT']" @change="onItemChange(item)" />
              </div>
              
              <div class="flex-1">
                <USelectMenu
                  v-if="item.type === 'PRODUCT'"
                  v-model="item.productId"
                  :items="products"
                  label-key="name"
                  value-key="id"
                  searchable
                  placeholder="Buscar producto"
                  @change="onItemChange(item)"
                />
                <USelectMenu
                  v-else-if="item.type === 'SERVICE'"
                  v-model="item.serviceId"
                  :items="services"
                  label-key="name"
                  value-key="id"
                  searchable
                  placeholder="Buscar servicio"
                  @change="onItemChange(item)"
                />
                <UInput v-else v-model="item.name" placeholder="Concepto / Detalle" />
              </div>

              <div class="w-20">
                <UInput type="number" v-model.number="item.quantity" min="1" placeholder="Cant" />
              </div>
              <div class="w-24">
                <UInput type="number" v-model.number="item.price" min="0" step="0.01" placeholder="Precio" />
              </div>
              <UButton icon="i-heroicons-trash" color="red" variant="ghost" @click="removeItem(index)" />
            </div>
            <UButton icon="i-heroicons-plus" variant="soft" block @click="addItem">Agregar Ítem</UButton>
          </div>

          <!-- Payment -->
          <div class="grid grid-cols-2 gap-4 border-t pt-4">
            <UFormGroup label="Caja">
              <USelect v-model="saleForm.cashBoxId" :items="cashBoxOptions" value-key="value" label-key="label" />
            </UFormGroup>
            <div class="grid grid-cols-2 gap-2">
               <UFormGroup label="Método">
                 <USelect v-model="saleForm.paymentMethod" :items="['CASH', 'CARD', 'TRANSFER', 'OTHER']" />
               </UFormGroup>
               <UFormGroup label="Medio">
                 <USelect v-model="saleForm.paymentMediumId" :items="payMediaOptions" value-key="value" label-key="label" />
               </UFormGroup>
            </div>
          </div>

          <div class="text-right text-xl font-bold">
            Total: ${{ total }}
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="gray" variant="ghost" @click="isNewSaleOpen = false">Cancelar</UButton>
            <UButton color="primary" @click="submitSale">Registrar Venta</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
