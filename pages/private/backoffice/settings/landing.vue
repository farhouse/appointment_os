<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN']
})

const { t } = useI18n()
const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const html = ref('')

const defaultTemplate = `<section style="max-width: 960px; margin: 0 auto; padding: 2rem 1rem; font-family: Inter, system-ui, -apple-system, sans-serif;">
  <h1 style="font-size: 2.2rem; margin-bottom: .5rem;">Bienvenido a tu espacio</h1>
  <p style="color: #4b5563; margin-bottom: 1rem;">Reservá tu turno en segundos y gestioná todo desde un solo lugar.</p>
  <p>
    <a href="/book" style="display:inline-block;background:#111827;color:#fff;padding:.65rem 1rem;border-radius:.5rem;text-decoration:none;">Reservar ahora</a>
  </p>
</section>`

async function loadConfig() {
  loading.value = true
  try {
    const res = await $fetch('/api/settings/landing')
    html.value = res?.html || ''
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || t('pages.settings.landing.loadError'), color: 'error' })
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  saving.value = true
  try {
    const res = await $fetch('/api/settings/landing', {
      method: 'PATCH',
      body: { html: html.value }
    })
    html.value = res?.html || ''
    toast.add({ title: t('pages.settings.landing.saved'), color: 'success' })
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || t('pages.settings.landing.saveError'), color: 'error' })
  } finally {
    saving.value = false
  }
}

function applyDefaultTemplate() {
  html.value = defaultTemplate
}

function resetLanding() {
  html.value = ''
}

onMounted(() => { void loadConfig() })
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">{{ $t('pages.settings.landing.title') }}</h1>
      <p class="text-sm text-gray-600">{{ $t('pages.settings.landing.subtitle') }}</p>
    </div>

    <BackofficeSettingsNav />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm space-y-3">
        <div class="flex items-center justify-between gap-2">
          <div class="text-sm font-medium">{{ $t('pages.settings.landing.editor') }}</div>
          <div class="flex gap-2">
            <UButton color="neutral" variant="outline" size="sm" @click="applyDefaultTemplate">{{ $t('pages.settings.landing.useTemplate') }}</UButton>
            <UButton color="neutral" variant="outline" size="sm" @click="resetLanding">{{ $t('pages.settings.landing.reset') }}</UButton>
          </div>
        </div>
        <UTextarea v-model="html" :rows="18" autoresize />
        <div class="flex justify-end">
          <UButton :loading="saving" :disabled="loading" @click="saveConfig">{{ $t('pages.settings.landing.save') }}</UButton>
        </div>
      </div>

      <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <div class="text-sm font-medium mb-3">{{ $t('pages.settings.landing.preview') }}</div>
        <div v-if="loading" class="text-sm text-gray-500">{{ $t('pages.settings.landing.loading') }}</div>
        <div v-else class="prose max-w-none" v-html="html" />
      </div>
    </div>
  </div>
</template>
