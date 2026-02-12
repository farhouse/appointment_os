<script setup lang="ts">
import { VueCal } from 'vue-cal'

const props = defineProps<{
  config: Record<string, any>
}>()

const attrs = useAttrs()

const mergedProps = computed(() => ({
  ...props.config,
  ...attrs
}))
</script>

<template>
  <VueCal v-bind="mergedProps" />
</template>
