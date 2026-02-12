<template>
  <div class="min-h-screen bg-gray-100">
    <div class="flex items-center justify-between px-6 py-4">
      <div class="text-lg font-semibold">{{ $t('app.name') }}</div>
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
  </div>
</template>

<script setup lang="ts">
const { locale, locales } = useI18n()
</script>
