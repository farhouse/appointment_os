<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN', 'MANAGER'],
})

await navigateTo('/private/backoffice/products', { replace: true })
</script>

<template />
