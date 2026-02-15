<script setup lang="ts">
defineProps<{
  title: string
  searchPlaceholder: string
  searchValue: string
  isLoading?: boolean
  errorMessage?: string
  canCreate?: boolean
  createLabel?: string
}>()

defineEmits<{ search: [value: string]; create: [] }>()
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-stone-900">{{ title }}</h1>
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UInput
          :model-value="searchValue"
          icon="i-lucide-search"
          :placeholder="searchPlaceholder"
          :loading="isLoading"
          class="w-56"
          @update:model-value="$emit('search', $event as string)"
        />
        <UButton v-if="canCreate" color="primary" @click="$emit('create')">
          {{ createLabel || 'New' }}
        </UButton>
      </div>
    </div>

    <div class="rounded-lg border border-stone-200 bg-white shadow-sm">
      <slot />
    </div>
  </div>
</template>
