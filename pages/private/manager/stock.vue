<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN', 'MANAGER'],
})

await navigateTo({ path: '/private/manager/products', query: { tab: 'stock' } })
</script>

<template />
