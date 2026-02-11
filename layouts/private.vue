<script setup lang="ts">
// Placeholder "chrome" layout for all authenticated areas.
// Menu should be filtered by role (RBAC) but layout stays shared.
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="flex">
      <aside class="w-64 border-r bg-white min-h-screen p-4">
        <div class="font-semibold">barber-os</div>
        <div class="text-xs text-gray-500 mt-1">Private</div>
        <nav class="mt-6 space-y-2 text-sm">
          <NuxtLink class="block hover:underline" to="/private">Home</NuxtLink>
          <NuxtLink class="block hover:underline" to="/private/manager">Manager</NuxtLink>
          <NuxtLink class="block hover:underline" to="/private/barber">Barber</NuxtLink>
          <NuxtLink class="block hover:underline" to="/private/client">Client</NuxtLink>
        </nav>
      </aside>

      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
