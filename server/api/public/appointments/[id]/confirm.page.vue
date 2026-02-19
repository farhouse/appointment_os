<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()

const id = computed(() => String(route.params.id || ''))
const token = computed(() => String(route.query.token || ''))

const { pending, error } = useFetch(() => `/api/public/appointments/${encodeURIComponent(id.value)}/confirm?token=${encodeURIComponent(token.value)}`)
</script>

<template>
  <div class="py-10">
    <div class="max-w-xl mx-auto px-4">
      <h1 class="text-2xl font-semibold">{{ t('booking.confirmPage.title') }}</h1>
      <p v-if="pending" class="mt-3 text-gray-600">{{ t('booking.confirmPage.working') }}</p>
      <p v-else-if="error" class="mt-3 text-red-700">{{ t('booking.confirmPage.error') }}</p>
      <p v-else class="mt-3 text-green-700">{{ t('booking.confirmPage.success') }}</p>
      <div class="mt-6">
        <UButton to="/book" variant="outline">{{ t('booking.confirmPage.back') }}</UButton>
      </div>
    </div>
  </div>
</template>
