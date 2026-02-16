<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN', 'MANAGER'],
})

await navigateTo('/private/backoffice/settings', { replace: true })
</script>

<template />
