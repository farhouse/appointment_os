<template>
  <div class="container mx-auto p-4 text-gray-900 dark:text-gray-100">
    <div class="flex flex-wrap justify-between items-center gap-3 mb-6">
      <h1 class="text-3xl font-bold">{{ $t('app.name') }}</h1>
      <div class="flex items-center gap-2">
        <UButton to="/" variant="ghost">{{ $t('nav.home') }}</UButton>
        <UButton to="/calendar" variant="ghost">{{ $t('nav.calendar') }}</UButton>
        <select
          v-model="locale"
          class="border border-gray-300 rounded px-2 py-1 text-sm bg-white dark:bg-gray-900 dark:border-gray-700"
          :aria-label="$t('language.label')"
        >
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
