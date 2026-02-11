<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private'],
})

type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'BARBER' | 'CLIENT'

const { data, error } = await useFetch('/api/me')
if (error.value) {
  await navigateTo('/login')
}

const me: any = data.value?.user ?? data.value
const role: Role | undefined = me?.role

if (role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER') {
  await navigateTo('/private/manager')
} else if (role === 'BARBER') {
  await navigateTo('/private/barber')
} else if (role === 'CLIENT') {
  await navigateTo('/private/client')
}
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold">Private</h1>
    <p class="text-sm text-gray-600">Redirecting…</p>
  </div>
</template>
