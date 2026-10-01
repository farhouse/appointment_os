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
  <div class="p-8 text-center">
    <UIcon v-if="icon" :name="icon" class="mx-auto mb-3 h-10 w-10 text-[#8b98aa]" />
    <div class="text-base font-semibold text-[#17233c]">{{ title }}</div>
    <p class="mx-auto mt-1 max-w-md text-sm text-[#627087]">{{ description }}</p>
    <div v-if="actionLabel" class="mt-4">
      <UButton color="primary" :disabled="actionDisabled" @click="$emit('action')">
        {{ actionLabel }}
      </UButton>
    </div>
  </div>
</template>
