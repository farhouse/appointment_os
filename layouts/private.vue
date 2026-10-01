<script setup lang="ts">
import type { Role } from '~/composables/useMe'
import { useMeState } from '~/composables/useMe'
import { useSelectedBranch } from '~/composables/useSelectedBranch'

const me = useMeState()
const route = useRoute()
const sidebarOpen = ref(false)
const role = computed<Role | undefined>(() => me.value?.role)

const isAdmin = computed(() => role.value === 'OWNER' || role.value === 'ADMIN')
const isOwner = computed(() => role.value === 'OWNER')
const isManager = computed(() => role.value === 'MANAGER')
const isWorker = computed(() => role.value === 'BARBER')
const isClient = computed(() => role.value === 'CLIENT')

const { t, locale, locales } = useI18n()

const managerLinks = computed(() => [
  { label: t('nav.dashboard'), to: '/private/backoffice', icon: 'i-heroicons-home' },
  { label: t('nav.calendar'), to: '/private/backoffice/calendar', icon: 'i-heroicons-calendar-days' },
  { label: t('nav.sales'), to: '/private/backoffice/sales', icon: 'i-heroicons-shopping-cart' },
  { label: t('nav.cash'), to: '/private/backoffice/cash', icon: 'i-heroicons-banknotes' },
  { label: t('nav.clients'), to: '/private/backoffice/clients', icon: 'i-heroicons-user-group' },
  { label: t('nav.products'), to: '/private/backoffice/products', icon: 'i-heroicons-cube' },
  { label: t('nav.services'), to: '/private/backoffice/services', icon: 'i-lucide-wand-sparkles' },
])

const adminLinks = computed(() => [
  ...managerLinks.value.slice(0, 4),
  { label: t('nav.employees'), to: '/private/backoffice/employees', icon: 'i-heroicons-users' },
  ...managerLinks.value.slice(4),
  ...(isOwner.value ? [{ label: t('nav.branches'), to: '/private/backoffice/branches', icon: 'i-heroicons-map-pin' }] : []),
  { label: t('nav.settings'), to: '/private/backoffice/settings', icon: 'i-heroicons-cog-6-tooth' },
])

const workerLinks = computed(() => [
  { label: t('nav.today'), to: '/private/worker/today', icon: 'i-heroicons-calendar' },
  { label: t('nav.finances'), to: '/private/worker/finances', icon: 'i-heroicons-chart-bar' },
  { label: t('nav.appointments'), to: '/private/worker/appointments', icon: 'i-heroicons-clipboard-document-list' },
])

const clientLinks = computed(() => [
  { label: t('nav.home'), to: '/private/client', icon: 'i-heroicons-home' },
  { label: t('nav.book'), to: '/private/client/book', icon: 'i-heroicons-pencil-square' },
  { label: t('nav.appointments'), to: '/private/client/appointments', icon: 'i-heroicons-clipboard-document-list' },
  { label: t('nav.redeem'), to: '/private/client/redeem', icon: 'i-heroicons-gift' },
])

const roleLinks = computed(() => {
  if (isAdmin.value) return adminLinks.value
  if (isManager.value) return managerLinks.value
  if (isWorker.value) return workerLinks.value
  if (isClient.value) return clientLinks.value
  return []
})

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  useState('me', () => null).value = null
  await navigateTo('/')
}

const primaryBranchId = computed(() => me.value?.branches?.[0]?.branchId)
const { selectedBranchId, branchOptions, isLoading, isSwitching } = useSelectedBranch(primaryBranchId)
const showBranchSelector = computed(() => {
  if (isClient.value) return false
  if (isManager.value) return (me.value?.branches?.length || 0) > 1
  return true
})

watch(() => route.fullPath, () => { sidebarOpen.value = false })

function localePrefix(code: string) {
  return code === 'es-AR' ? 'AR' : code === 'en' ? 'EN' : code
}
</script>

<template>
  <div class="min-h-screen bg-[#f6f8fb] text-[#17233c]">
    <button v-if="sidebarOpen" type="button" class="fixed inset-0 z-30 bg-[#17233c]/30 lg:hidden" aria-label="Cerrar navegación" @click="sidebarOpen = false" />

    <aside class="fixed inset-y-0 left-0 z-40 flex w-60 -translate-x-full flex-col border-r border-[#d9e1ea] bg-white transition-transform lg:translate-x-0" :class="sidebarOpen ? 'translate-x-0' : ''">
      <div class="border-b border-[#edf1f6] px-5 py-5">
        <div class="text-xl font-bold text-[#17233c]">{{ $t('app.name') }}</div>
        <div class="mt-1 text-xs text-[#627087]">Operaciones de servicios</div>
      </div>

      <nav class="min-h-0 flex-1 overflow-y-auto p-3" aria-label="Navegación principal">
        <NuxtLink v-for="link in roleLinks" :key="link.to" :to="link.to" class="mb-1 flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-[#4b586d] transition-colors hover:bg-[#edf1f6] hover:text-[#17233c]" active-class="bg-[#dbeafe] text-[#1d4ed8]">
          <UIcon :name="link.icon" class="size-5 shrink-0" />
          <span>{{ link.label }}</span>
        </NuxtLink>
      </nav>

      <div class="border-t border-[#edf1f6] p-3">
        <NuxtLink to="/private/profile" class="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-[#edf1f6]">
          <span class="grid size-9 place-items-center rounded-full bg-[#17233c] text-xs font-semibold text-white">{{ (me?.name || me?.email || 'U').slice(0, 2).toUpperCase() }}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold">{{ me?.name || me?.email }}</span>
            <span class="block truncate text-xs text-[#627087]">{{ $t('nav.profile') }}</span>
          </span>
        </NuxtLink>
        <button type="button" class="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[#627087] hover:bg-[#edf1f6] hover:text-[#17233c]" @click="logout">
          <UIcon name="i-heroicons-arrow-left-on-rectangle" class="size-5" />
          {{ $t('nav.logout') }}
        </button>
      </div>
    </aside>

    <div class="lg:pl-60">
      <header class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#d9e1ea] bg-white/95 px-4 backdrop-blur-sm sm:px-6">
        <UButton icon="i-heroicons-bars-3" color="neutral" variant="ghost" class="lg:hidden" aria-label="Abrir navegación" @click="sidebarOpen = true" />

        <label v-if="showBranchSelector" class="flex min-w-0 items-center gap-2 text-xs text-[#627087]">
          <span class="hidden sm:inline">{{ $t('branch.label') }}</span>
          <select v-model="selectedBranchId" class="h-9 min-w-0 max-w-56 rounded-md border border-[#d9e1ea] bg-white px-3 text-sm font-semibold text-[#17233c] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#bfdbfe]" :disabled="isLoading || branchOptions.length === 0">
            <option value="">{{ $t('branch.all') }}</option>
            <option v-for="branch in branchOptions" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
          </select>
          <UIcon v-if="isLoading || isSwitching" name="i-heroicons-arrow-path" class="size-4 animate-spin" />
        </label>

        <div class="ml-auto flex items-center gap-2">
          <select v-model="locale" class="h-9 rounded-md border border-[#d9e1ea] bg-white px-2 text-xs font-semibold text-[#4b586d] focus:border-[#2563eb] focus:outline-none">
            <option v-for="loc in locales" :key="loc.code" :value="loc.code">{{ localePrefix(loc.code) }}</option>
          </select>
          <NuxtLink to="/private/profile" class="hidden items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#edf1f6] sm:flex">
            <span class="grid size-8 place-items-center rounded-full bg-[#dbeafe] text-xs font-bold text-[#1d4ed8]">{{ (me?.name || 'U').slice(0, 2).toUpperCase() }}</span>
            <span class="max-w-36 truncate text-sm font-semibold">{{ me?.name }}</span>
          </NuxtLink>
        </div>
      </header>

      <main class="min-w-0 p-4 sm:p-6 xl:p-7">
        <slot />
      </main>
    </div>
  </div>
</template>
