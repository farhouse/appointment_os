<template>
  <div class="min-h-screen bg-[#fbf5ea] text-stone-900 dark:bg-[#1a120d] dark:text-stone-100">
    <div class="flex items-center justify-between px-6 py-4">
      <div class="text-lg font-semibold">{{ $t('app.name') }}</div>
      <div class="flex items-center gap-2 text-sm">
        <span class="text-stone-600 dark:text-stone-300">{{ $t('language.label') }}</span>
        <select v-model="locale" class="border border-stone-300 rounded px-2 py-1 bg-white dark:bg-[#20160f] dark:border-[#4a3426]">
          <option v-for="loc in locales" :key="loc.code" :value="loc.code">
            {{ localePrefix(loc.code) }} · {{ (loc as any).name || loc.code }}
          </option>
        </select>
        <!-- Dark mode toggle removed -->
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
