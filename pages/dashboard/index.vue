<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold mb-6">{{ $t('nav.dashboard') }}</h1>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-6 bg-white rounded shadow">
        <h2 class="text-xl font-semibold mb-2">{{ $t('nav.appointments') }}</h2>
        <NuxtLink to="/calendar" class="text-blue-600 hover:underline">{{ $t('landing.viewCalendar') }}</NuxtLink>
      </div>
      <div class="p-6 bg-white rounded shadow">
        <h2 class="text-xl font-semibold mb-2">{{ $t('nav.employees') }}</h2>
        <p class="text-gray-600">{{ $t('dashboard.manageStaff') }}</p>
      </div>
      <div class="p-6 bg-white rounded shadow">
        <h2 class="text-xl font-semibold mb-2">{{ $t('dashboard.reports') }}</h2>
        <p class="text-gray-600">{{ $t('dashboard.viewSales') }}</p>
      </div>
    </div>
    <div class="mt-8">
      <button @click="logout" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">{{ $t('dashboard.logout') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  router.push('/login')
}
</script>
