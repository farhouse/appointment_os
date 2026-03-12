<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['BARBER'],
})

await navigateTo('/private/barber/appointments')
</script>
