<script setup lang="ts">
// Shared authenticated layout ("chrome").
// The sidebar menu is filtered by role.

type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'BARBER' | 'CLIENT'

const me = useState<any | null>('me', () => null)

if (!me.value) {
  // best-effort: pages already run middleware/private, but layout can be hit during hydration
  const { data } = await useFetch('/api/me')
  me.value = data.value?.user ?? data.value ?? null
}

const role = computed<Role | undefined>(() => me.value?.role)

const isManager = computed(() => role.value === 'OWNER' || role.value === 'ADMIN' || role.value === 'MANAGER')
const isBarber = computed(() => role.value === 'BARBER')
const isClient = computed(() => role.value === 'CLIENT')
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="flex">
      <aside class="w-64 border-r bg-white min-h-screen p-4">
        <div class="font-semibold">barber-os</div>
        <div class="text-xs text-gray-500 mt-1">Private</div>

        <nav class="mt-6 space-y-4 text-sm">
          <div>
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Common</div>
            <div class="mt-2 space-y-1">
              <NuxtLink class="block hover:underline" to="/private">Home</NuxtLink>
            </div>
          </div>

          <div v-if="isManager">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Manager</div>
            <div class="mt-2 space-y-1">
              <NuxtLink class="block hover:underline" to="/private/manager">Dashboard</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/manager/calendar">Calendar</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/manager/cash">Cash</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/manager/products">Products</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/manager/stock">Stock</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/manager/employees">Employees</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/manager/settings">Settings</NuxtLink>
            </div>
          </div>

          <div v-if="isBarber">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Barber</div>
            <div class="mt-2 space-y-1">
              <NuxtLink class="block hover:underline" to="/private/barber">Home</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/barber/today">Today</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/barber/appointments">Appointments</NuxtLink>
            </div>
          </div>

          <div v-if="isClient">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</div>
            <div class="mt-2 space-y-1">
              <NuxtLink class="block hover:underline" to="/private/client">Home</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/client/book">Book</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/client/appointments">Appointments</NuxtLink>
            </div>
          </div>
        </nav>
      </aside>

      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
