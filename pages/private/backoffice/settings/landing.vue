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

const defaultTemplate = `<section style="max-width: 960px; margin: 0 auto; padding: 3rem 1.5rem; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #17233c;">
  <h1 style="font-family: Georgia, serif; font-size: 2.5rem; line-height: 1.05; margin: 0 0 .75rem;">Tu próximo turno, en claro</h1>
  <p style="max-width: 620px; color: #627087; line-height: 1.6; margin: 0 0 1.5rem;">Reservá el servicio que necesitás y elegí el horario que mejor se adapte a tu día.</p>
  <p>
    <a href="/book" style="display:inline-block;background:#2563eb;color:#fff;padding:.7rem 1rem;border-radius:.375rem;text-decoration:none;font-weight:600;">Reservar turno</a>
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
    <div class="max-w-3xl">
      <h1 class="text-2xl font-semibold text-[#17233c]">{{ $t('pages.settings.landing.title') }}</h1>
      <p class="mt-1 text-sm text-[#627087]">{{ $t('pages.settings.landing.subtitle') }}</p>
    </div>

    <BackofficeSettingsNav />

    <div class="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
      <section class="overflow-hidden rounded-lg border border-[#d9e1ea] bg-white">
        <div class="flex flex-wrap items-start justify-between gap-3 border-b border-[#d9e1ea] px-4 py-3">
          <div>
            <h2 class="text-base font-semibold text-[#17233c]">{{ $t('pages.settings.landing.editor') }}</h2>
            <p class="mt-0.5 text-xs text-[#627087]">HTML personalizado para la página pública.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <UButton color="neutral" variant="outline" size="sm" icon="i-lucide-layout-template" @click="applyDefaultTemplate">
              {{ $t('pages.settings.landing.useTemplate') }}
            </UButton>
            <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-rotate-ccw" @click="resetLanding">
              {{ $t('pages.settings.landing.reset') }}
            </UButton>
          </div>
        </div>

        <div class="p-4">
          <UTextarea
            v-model="html"
            :rows="20"
            :disabled="loading"
            autoresize
            class="w-full"
            :ui="{ base: 'min-h-[480px] font-mono text-xs leading-5' }"
          />
        </div>

        <div class="flex items-center justify-between gap-4 border-t border-[#d9e1ea] bg-[#f6f8fb] px-4 py-3">
          <span class="text-xs tabular-nums text-[#627087]">{{ html.length.toLocaleString() }} / 50.000 caracteres</span>
          <UButton icon="i-lucide-save" :loading="saving" :disabled="loading" @click="saveConfig">
            {{ $t('pages.settings.landing.save') }}
          </UButton>
        </div>
      </section>

      <section class="self-start overflow-hidden rounded-lg border border-[#d9e1ea] bg-white xl:sticky xl:top-24">
        <div class="flex items-center justify-between border-b border-[#d9e1ea] px-4 py-3">
          <h2 class="text-base font-semibold text-[#17233c]">{{ $t('pages.settings.landing.preview') }}</h2>
          <UBadge color="neutral" variant="subtle">Vista previa</UBadge>
        </div>
        <div class="min-h-[360px] bg-[#f6f8fb] p-3 sm:p-5">
          <div v-if="loading" class="flex min-h-[320px] items-center justify-center text-sm text-[#627087]">
            {{ $t('pages.settings.landing.loading') }}
          </div>
          <div v-else-if="!html.trim()" class="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <UIcon name="i-lucide-panel-top" class="size-8 text-[#627087]" />
            <p class="mt-3 text-sm font-medium text-[#17233c]">La landing está vacía</p>
            <p class="mt-1 max-w-xs text-xs leading-5 text-[#627087]">Usá la plantilla base o escribí el contenido para verlo acá.</p>
          </div>
          <div v-else class="min-h-[320px] overflow-hidden rounded-md border border-[#d9e1ea] bg-white">
            <div class="prose max-w-none" v-html="html" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
