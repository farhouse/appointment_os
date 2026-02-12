<template>
  <div class="container mx-auto p-4">
    <div class="flex flex-wrap justify-between items-center gap-3 mb-6">
      <h1 class="text-3xl font-bold">{{ $t('app.name') }}</h1>
      <div class="flex items-center gap-2">
        <UButton to="/" variant="ghost">{{ $t('nav.home') }}</UButton>
        <UButton to="/calendar" variant="ghost">{{ $t('nav.calendar') }}</UButton>
        <select
          v-model="locale"
          class="border rounded px-2 py-1 text-sm"
          :aria-label="$t('language.label')"
        >
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
