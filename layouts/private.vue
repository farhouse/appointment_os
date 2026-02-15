<script setup lang="ts">
// Shared authenticated layout ("chrome").
// The sidebar menu is filtered by role.

import type { Role } from '~/composables/useMe'
import { useMeState } from '~/composables/useMe'
import { useSelectedBranch } from '~/composables/useSelectedBranch'

const me = useMeState()

const role = computed<Role | undefined>(() => me.value?.role)

const isManager = computed(() => role.value === 'OWNER' || role.value === 'ADMIN' || role.value === 'MANAGER')
const isBarber = computed(() => role.value === 'BARBER')
const isClient = computed(() => role.value === 'CLIENT')

const primaryBranchId = computed(() => me.value?.branches?.[0]?.branchId)
const { selectedBranchId, branchOptions, isLoading } = useSelectedBranch(primaryBranchId)
const { locale, locales } = useI18n()
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="flex">
      <aside class="w-64 border-r bg-white min-h-screen p-4">
        <div class="font-semibold">{{ $t('app.name') }}</div>
        <div class="text-xs text-gray-500 mt-1">{{ $t('app.private') }}</div>

        <nav class="mt-6 space-y-4 text-sm">
          <div>
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ $t('nav.common') }}</div>
            <div class="mt-2 space-y-1">
              <NuxtLink class="block hover:underline" to="/private">{{ $t('nav.home') }}</NuxtLink>
            </div>
          </div>

          <div v-if="isManager">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ $t('nav.manager') }}</div>
            <div class="mt-2 space-y-1">
              <NuxtLink class="block hover:underline" to="/private/manager">{{ $t('nav.dashboard') }}</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/manager/calendar">{{ $t('nav.calendar') }}</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/manager/cash">{{ $t('nav.cash') }}</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/manager/products">{{ $t('nav.products') }}</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/manager/stock">{{ $t('nav.stock') }}</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/manager/employees">{{ $t('nav.employees') }}</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/manager/settings">{{ $t('nav.settings') }}</NuxtLink>
            </div>
          </div>

          <div v-if="isBarber">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ $t('nav.barber') }}</div>
            <div class="mt-2 space-y-1">
              <NuxtLink class="block hover:underline" to="/private/barber/today">{{ $t('nav.today') }}</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/barber/finances">{{ $t('nav.finances') }}</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/barber/appointments">{{ $t('nav.appointments') }}</NuxtLink>
            </div>
          </div>

          <div v-if="isClient">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ $t('nav.client') }}</div>
            <div class="mt-2 space-y-1">
              <NuxtLink class="block hover:underline" to="/private/client">{{ $t('nav.home') }}</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/client/book">{{ $t('nav.book') }}</NuxtLink>
              <NuxtLink class="block hover:underline" to="/private/client/appointments">{{ $t('nav.appointments') }}</NuxtLink>
            </div>
          </div>
        </nav>
      </aside>

      <main class="flex-1 p-6">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div class="flex items-center gap-2 text-sm">
            <label class="text-gray-600" for="branch-selector">{{ $t('branch.label') }}</label>
            <select
              id="branch-selector"
              v-model="selectedBranchId"
              class="border rounded px-2 py-1"
              :disabled="isLoading"
            >
              <option value="">{{ $t('branch.all') }}</option>
              <option v-for="branch in branchOptions" :key="branch.id" :value="branch.id">
                {{ branch.name }}
              </option>
            </select>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <span class="text-gray-600">{{ $t('language.label') }}</span>
            <select v-model="locale" class="border rounded px-2 py-1">
              <option v-for="loc in locales" :key="loc.code" :value="loc.code">
                {{ loc.name }}
              </option>
            </select>
          </div>
        </div>
        <slot />
      </main>
    </div>
  </div>
</template>
