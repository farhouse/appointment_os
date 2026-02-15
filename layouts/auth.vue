<template>
  <div class="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
    <div class="flex items-center justify-between px-6 py-4">
      <div class="text-lg font-semibold">{{ $t('app.name') }}</div>
      <div class="flex items-center gap-2 text-sm">
        <span class="text-gray-600 dark:text-gray-300">{{ $t('language.label') }}</span>
        <select v-model="locale" class="border border-gray-300 rounded px-2 py-1 bg-white dark:bg-gray-900 dark:border-gray-700">
          <option v-for="loc in locales" :key="loc.code" :value="loc.code">
            {{ localePrefix(loc.code) }} · {{ (loc as any).name || loc.code }}
          </option>
        </select>
        <UColorModeButton size="sm" color="neutral" variant="ghost" class="border border-gray-200 dark:border-gray-700" />
      </div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
const { locale, locales } = useI18n()

function localePrefix(code: string) {
  if (code === 'es-AR') return 'AR'
  if (code === 'en') return 'EN'
  return code
}
</script>
