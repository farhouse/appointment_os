<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN', 'MANAGER'],
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">Manager</h1>
    <p class="text-sm text-gray-600">Manager/Admin/Owner workspace (skeleton).</p>
  </div>
</template>
