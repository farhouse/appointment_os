<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN', 'MANAGER'],
})

await navigateTo({ path: '/private/backoffice/products', query: { tab: 'stock' } }, { replace: true })
</script>

<template />
