<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN']
})

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
    toast.add({ title: e?.data?.statusMessage || 'No se pudo cargar la landing', color: 'error' })
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
    toast.add({ title: 'Landing guardada', color: 'success' })
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || 'No se pudo guardar', color: 'error' })
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
      <h1 class="text-2xl font-semibold">Landing</h1>
      <p class="text-sm text-gray-600">Pegá HTML custom para la home pública.</p>
    </div>

    <BackofficeSettingsNav />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm space-y-3">
        <div class="flex items-center justify-between gap-2">
          <div class="text-sm font-medium">Editor HTML</div>
          <div class="flex gap-2">
            <UButton color="neutral" variant="outline" size="sm" @click="applyDefaultTemplate">Usar plantilla</UButton>
            <UButton color="neutral" variant="outline" size="sm" @click="resetLanding">Reset</UButton>
          </div>
        </div>
        <UTextarea v-model="html" :rows="18" autoresize />
        <div class="flex justify-end">
          <UButton :loading="saving" :disabled="loading" @click="saveConfig">Guardar</UButton>
        </div>
      </div>

      <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <div class="text-sm font-medium mb-3">Preview</div>
        <div v-if="loading" class="text-sm text-gray-500">Cargando…</div>
        <div v-else class="prose max-w-none" v-html="html" />
      </div>
    </div>
  </div>
</template>
