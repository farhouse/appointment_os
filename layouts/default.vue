<template>
  <div class="min-h-screen bg-[#fbf5ea] text-stone-900 dark:bg-[#1a120d] dark:text-stone-100">
    <div class="container mx-auto p-4">
    <div class="flex flex-wrap justify-between items-center gap-3 mb-6">
      <h1 class="text-3xl font-bold">{{ $t('app.name') }}</h1>
      <div class="flex items-center gap-2">
        <UButton to="/" variant="ghost">{{ $t('nav.home') }}</UButton>
        <UButton to="/calendar" variant="ghost">{{ $t('nav.calendar') }}</UButton>
        <select
          v-model="locale"
          class="border border-stone-300 rounded px-2 py-1 text-sm bg-white dark:bg-[#20160f] dark:border-[#4a3426]"
          :aria-label="$t('language.label')"
        >
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
