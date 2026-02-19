<script setup lang="ts">
// Shared authenticated layout ("chrome").
// Sidebar menu is filtered by role.

import type { Role } from '~/composables/useMe'
import { useMeState } from '~/composables/useMe'
import { useSelectedBranch } from '~/composables/useSelectedBranch'

const me = useMeState()

const role = computed<Role | undefined>(() => me.value?.role)

const isAdmin = computed(() => role.value === 'OWNER' || role.value === 'ADMIN')
const isOwner = computed(() => role.value === 'OWNER')
const isManager = computed(() => role.value === 'MANAGER')
const isBarber = computed(() => role.value === 'BARBER')
const isClient = computed(() => role.value === 'CLIENT')

const { t } = useI18n()

const commonLinks = computed(() => [
  { label: t('nav.home'), to: '/private', icon: 'i-heroicons-home' },
])

const managerLinks = computed(() => [
  { label: t('nav.dashboard'), to: '/private/backoffice', icon: 'i-heroicons-squares-2x2' },
  { label: t('nav.calendar'), to: '/private/backoffice/calendar', icon: 'i-heroicons-calendar-days' },
  { label: t('nav.cash'), to: '/private/backoffice/cash', icon: 'i-heroicons-banknotes' },
  { label: t('nav.products'), to: '/private/backoffice/products', icon: 'i-heroicons-tag' },
  { label: t('nav.services'), to: '/private/backoffice/services', icon: 'i-lucide-wand-sparkles' },
])

const adminLinks = computed(() => [
  { label: t('nav.dashboard'), to: '/private/backoffice', icon: 'i-heroicons-squares-2x2' },
  { label: t('nav.calendar'), to: '/private/backoffice/calendar', icon: 'i-heroicons-calendar-days' },
  { label: t('nav.cash'), to: '/private/backoffice/cash', icon: 'i-heroicons-banknotes' },
  { label: t('nav.employees'), to: '/private/backoffice/employees', icon: 'i-heroicons-users' },
  { label: t('nav.products'), to: '/private/backoffice/products', icon: 'i-heroicons-tag' },
  { label: t('nav.services'), to: '/private/backoffice/services', icon: 'i-lucide-wand-sparkles' },
  ...(isOwner.value ? [{ label: t('nav.branches'), to: '/private/backoffice/branches', icon: 'i-heroicons-map-pin' }] : []),
  { label: t('nav.settings'), to: '/private/backoffice/settings', icon: 'i-heroicons-cog-6-tooth' },
])

const barberLinks = computed(() => [
  { label: t('nav.today'), to: '/private/barber/today', icon: 'i-heroicons-calendar' },
  { label: t('nav.finances'), to: '/private/barber/finances', icon: 'i-heroicons-chart-bar' },
  { label: t('nav.appointments'), to: '/private/barber/appointments', icon: 'i-heroicons-clipboard-document-list' },
])

const clientLinks = computed(() => [
  { label: t('nav.home'), to: '/private/client', icon: 'i-heroicons-home' },
  { label: t('nav.book'), to: '/private/client/book', icon: 'i-heroicons-pencil-square' },
  { label: t('nav.appointments'), to: '/private/client/appointments', icon: 'i-heroicons-clipboard-document-list' },
  { label: t('nav.redeem'), to: '/private/client/redeem', icon: 'i-heroicons-gift' },
])

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  // Clear cached user
  useState('me', () => null).value = null
  await navigateTo('/')
}

const accountLinks = computed(() => [
  { label: t('nav.profile'), to: '/private/profile', icon: 'i-heroicons-user-circle' },
  { label: t('nav.logout'), icon: 'i-heroicons-arrow-left-on-rectangle', onSelect: logout }
])

const primaryBranchId = computed(() => me.value?.branches?.[0]?.branchId)
const { selectedBranchId, branchOptions, isLoading, isSwitching } = useSelectedBranch(primaryBranchId)
const { locale, locales } = useI18n()

// Workaround: native <select disabled> attribute is getting stuck even after options load
// (likely hydration/patching issue). Force-enable it once we have options.
const branchSelectEl = ref<HTMLSelectElement | null>(null)
watchEffect(async () => {
  if (!branchSelectEl.value) return
  if (branchOptions.value.length === 0) return
  await nextTick()
  branchSelectEl.value.disabled = false
  branchSelectEl.value.removeAttribute('disabled')
})

function localePrefix(code: string) {
  if (code === 'es-AR') return 'AR'
  if (code === 'en') return 'EN'
  return code
}
</script>

<template>
  <div class="min-h-screen bg-[#fbf5ea] text-stone-900 dark:bg-[#1a120d] dark:text-stone-100">
    <div class="flex">
      <aside class="w-72 border-r border-stone-200 bg-white min-h-screen p-4 dark:border-[#3a2a1f] dark:bg-[#1a120d]">
        <div class="font-semibold">{{ $t('app.name') }}</div>
        <div class="text-xs text-gray-500 mt-1 dark:text-gray-400">{{ $t('app.private') }}</div>

        <div class="mt-6 space-y-5">
          <div v-if="isAdmin">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">{{ $t('nav.admin') }}</div>
            <UNavigationMenu class="mt-2" orientation="vertical" :items="adminLinks" />
          </div>

          <div v-else-if="isManager">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">{{ $t('nav.manager') }}</div>
            <UNavigationMenu class="mt-2" orientation="vertical" :items="managerLinks" />
          </div>

          <div v-if="isBarber">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">{{ $t('nav.barber') }}</div>
            <UNavigationMenu class="mt-2" orientation="vertical" :items="barberLinks" />
          </div>

          <div v-if="isClient">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">{{ $t('nav.client') }}</div>
            <UNavigationMenu class="mt-2" orientation="vertical" :items="clientLinks" />
          </div>

          <div>
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">{{ $t('nav.account') }}</div>
            <UNavigationMenu class="mt-2" orientation="vertical" :items="accountLinks" />
          </div>
        </div>
      </aside>

      <main class="flex-1 p-6">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div v-if="!isClient" class="flex items-center gap-2 text-sm">
            <label class="text-stone-600 dark:text-stone-300" for="branch-selector">{{ $t('branch.label') }}</label>

            <div class="flex items-center gap-2">
              <select
                :key="`branch-selector-${branchOptions.length}`"
                id="branch-selector"
                ref="branchSelectEl"
                v-model="selectedBranchId"
                class="border border-stone-300 rounded px-2 py-1 bg-white dark:bg-[#20160f] dark:border-[#4a3426]"
                :disabled="branchOptions.length === 0"
                :aria-busy="(isLoading || isSwitching) ? 'true' : 'false'"
                @pointerdown="(e) => console.log('[branch-selector] pointerdown', { disabled: (e.target as HTMLSelectElement)?.disabled, attrDisabled: (e.target as HTMLSelectElement)?.hasAttribute('disabled'), expectedDisabled: (branchOptions.length === 0), isLoading, isSwitching, options: branchOptions?.length, value: selectedBranchId })"
                @click="(e) => console.log('[branch-selector] click', { disabled: (e.target as HTMLSelectElement)?.disabled, attrDisabled: (e.target as HTMLSelectElement)?.hasAttribute('disabled'), expectedDisabled: (branchOptions.length === 0), isLoading, isSwitching, options: branchOptions?.length, value: selectedBranchId })"
                @focus="() => console.log('[branch-selector] focus')"
              >
                <option value="">{{ $t('branch.all') }}</option>
                <option v-for="branch in branchOptions" :key="branch.id" :value="branch.id">
                  {{ branch.name }}
                </option>
              </select>

              <div v-if="isLoading || isSwitching" class="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-300">
                <span class="inline-block size-3 rounded-full border-2 border-stone-400 border-t-transparent animate-spin" aria-hidden="true" />
                <span>{{ isLoading ? 'Cargando sucursales…' : 'Aplicando…' }}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <span class="text-stone-600 dark:text-stone-300">{{ $t('language.label') }}</span>
            <select v-model="locale" class="border border-stone-300 rounded px-2 py-1 bg-white dark:bg-[#20160f] dark:border-[#4a3426]">
              <option v-for="loc in locales" :key="loc.code" :value="loc.code">
                {{ localePrefix(loc.code) }} · {{ (loc as any).name || loc.code }}
              </option>
            </select>
            <!-- Dark mode toggle removed -->
          </div>
        </div>
        <slot />
      </main>
    </div>
  </div>
</template>
