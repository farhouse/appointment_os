<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['BARBER'],
})

await navigateTo('/private/worker/today')
</script>
