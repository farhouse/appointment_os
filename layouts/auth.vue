<template>
  <div class="min-h-screen bg-[#f6f8fb] text-[#17233c]">
    <header class="flex h-16 items-center justify-between border-b border-[#d9e1ea] bg-white px-4 sm:px-6">
      <NuxtLink to="/" class="text-xl font-bold text-[#17233c]">{{ $t('app.name') }}</NuxtLink>
      <div class="flex items-center gap-2 text-sm">
        <span class="hidden text-[#627087] sm:inline">{{ $t('language.label') }}</span>
        <select v-model="locale" class="h-9 rounded-md border border-[#d9e1ea] bg-white px-2 text-xs font-semibold text-[#4b586d] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#bfdbfe]">
          <option v-for="loc in locales" :key="loc.code" :value="loc.code">
            {{ localePrefix(loc.code) }}
          </option>
        </select>
      </div>
    </header>
    <main class="grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-10 sm:px-6">
      <slot />
    </main>
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
