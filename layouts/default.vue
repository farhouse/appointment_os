<template>
  <div class="min-h-screen bg-[#f6f8fb] text-[#17233c]">
    <header class="border-b border-[#d9e1ea] bg-white">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
      <NuxtLink to="/" class="text-lg font-semibold text-[#17233c]">{{ $t('app.name') }}</NuxtLink>
      <div class="flex items-center gap-2">
        <UButton to="/" color="neutral" variant="ghost">{{ $t('nav.home') }}</UButton>
        <select
          v-model="locale"
          class="h-10 rounded-md border border-[#d9e1ea] bg-white px-2 text-sm text-[#17233c] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#bfdbfe]"
          :aria-label="$t('language.label')"
        >
          <option v-for="loc in locales" :key="loc.code" :value="loc.code">
            {{ localePrefix(loc.code) }} · {{ (loc as any).name || loc.code }}
          </option>
        </select>
      </div>
      </div>
    </header>
    <main>
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
