<script setup lang="ts">
defineProps<{
  title: string
  description: string
  icon?: string
  actionLabel?: string
  actionDisabled?: boolean
}>()

defineEmits<{ action: [] }>()
</script>

<template>
  <div class="rounded-lg border border-stone-200 bg-white p-8 text-center shadow-sm">
    <UIcon v-if="icon" :name="icon" class="mx-auto mb-3 h-10 w-10 text-stone-400" />
    <div class="text-base font-semibold text-stone-900">{{ title }}</div>
    <p class="mt-1 text-sm text-stone-600">{{ description }}</p>
    <div v-if="actionLabel" class="mt-4">
      <UButton color="primary" :disabled="actionDisabled" @click="$emit('action')">
        {{ actionLabel }}
      </UButton>
    </div>
  </div>
</template>
