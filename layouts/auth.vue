<template>
  <div class="min-h-screen bg-stone-100 text-stone-900 dark:bg-[#120c08] dark:text-stone-100">
    <div class="flex items-center justify-between px-6 py-4">
      <div class="text-lg font-semibold">{{ $t('app.name') }}</div>
      <div class="flex items-center gap-2 text-sm">
        <span class="text-stone-600 dark:text-stone-300">{{ $t('language.label') }}</span>
        <select v-model="locale" class="border border-stone-300 rounded px-2 py-1 bg-white dark:bg-[#20160f] dark:border-[#4a3426]">
          <option v-for="loc in locales" :key="loc.code" :value="loc.code">
            {{ localePrefix(loc.code) }} · {{ (loc as any).name || loc.code }}
          </option>
        </select>
        <UColorModeButton
          size="sm"
          color="neutral"
          variant="ghost"
          class="border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 dark:border-[#4a3426] dark:bg-[#20160f] dark:text-amber-100/90 dark:hover:bg-[#2a1d15]"
        />
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
