<script setup lang="ts">
definePageMeta({
  middleware: [
    function (to, from) {
      return navigateTo('/')
    }
  ]
})
</script>

<template>
  <div class="flex min-h-[50vh] items-center justify-center text-stone-500">
    Redirecting...
  </div>
</template>
