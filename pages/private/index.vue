<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private'],
})

import type { Role } from '~/composables/useMe'
import { loadMe } from '~/composables/useMe'

const me = await loadMe()
if (!me) {
  await navigateTo(`/login?redirect=${encodeURIComponent('/private')}`)
}

const role: Role | undefined = me?.role

if (role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER') {
  await navigateTo('/private/backoffice')
} else if (role === 'BARBER') {
  await navigateTo('/private/barber')
} else if (role === 'CLIENT') {
  await navigateTo('/private/client')
}
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold">{{ $t('pages.private.title') }}</h1>
    <p class="text-sm text-gray-600">{{ $t('pages.private.redirecting') }}</p>
  </div>
</template>
