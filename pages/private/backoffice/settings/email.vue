<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN']
})

type EmailStatus = {
  provider: string | null
  from: string | null
  replyTo: string | null
  providerActive: boolean
  fromConfigured: boolean
  replyToConfigured: boolean
  apiKeyConfigured: boolean
  dryRun: boolean
  confirmation: {
    enabled: boolean
    configurable: boolean
    note?: string
  }
}

const emailStatus = ref<EmailStatus | null>(null)
const emailStatusLoading = ref(false)
const emailStatusError = ref('')
const emailTestLoading = ref(false)
const emailTestMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const emailTestTarget = ref('')

const emailTemplate = ref('')
const emailTemplateLoading = ref(false)
const emailTemplateSaving = ref(false)
const emailTemplateMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const whatsappTemplate = ref('')
const whatsappTemplateLoading = ref(false)
const whatsappTemplateSaving = ref(false)
const whatsappTemplateMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const placeholderVars = computed(() => ({
  name: `{{${$t('placeholder.name')}}} `,
  date: `{{${$t('placeholder.date')}}} `,
  branch: `{{${$t('placeholder.branch')}}} `
}))

const emailTemplatePreview = computed(() => {
  const source = (emailTemplate.value || '').trim()
  if (!source) return '<p style="font-family:Arial,sans-serif;color:#666;padding:12px;">Sin contenido para previsualizar.</p>'

  const sampleValues: Record<string, string> = {
    name: 'Juan Pérez',
    date: new Date().toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' }),
    branch: 'Sucursal Centro',
    services: 'Corte + Barba',
    confirm_url: 'https://app.barberos.com/book/confirm/demo',
    expires_at: 'hoy 23:59'
  }

  return source.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, rawKey: string) => {
    const key = rawKey.toLowerCase()
    return sampleValues[key] ?? `{{${rawKey}}}`
  })
})

async function loadWhatsappTemplate() {
    whatsappTemplateLoading.value = true
    whatsappTemplateMessage.value = null
    try {
      const response = await $fetch('/api/settings/whatsapp-template')
      whatsappTemplate.value = response?.template || ''
    } catch (e: any) {
      whatsappTemplateMessage.value = { type: 'error', text: e?.data?.statusMessage || $t('pages.settings.email.whatsappTemplateLoadError') }
    } finally {
      whatsappTemplateLoading.value = false
    }
  }

  async function saveWhatsappTemplate() {
    if (!whatsappTemplate.value.trim()) return
    whatsappTemplateSaving.value = true
    whatsappTemplateMessage.value = null
    try {
      await $fetch('/api/settings/whatsapp-template', {
        method: 'PATCH',
        body: { template: whatsappTemplate.value }
      })
      whatsappTemplateMessage.value = { type: 'success', text: $t('pages.settings.email.whatsappTemplateSaved') }
    } catch (e: any) {
      whatsappTemplateMessage.value = { type: 'error', text: e?.data?.statusMessage || $t('pages.settings.email.whatsappTemplateError') }
    } finally {
      whatsappTemplateSaving.value = false
    }
  }

async function loadEmailStatus() {
  emailStatusLoading.value = true
  emailStatusError.value = ''
  try {
    emailStatus.value = await $fetch('/api/settings/email')
  } catch (e: any) {
    emailStatus.value = null
    emailStatusError.value = e?.data?.statusMessage || 'No se pudo cargar la configuración de email.'
  } finally {
    emailStatusLoading.value = false
  }
}

async function sendTestEmail() {
  if (!emailTestTarget.value.trim()) return
  emailTestLoading.value = true
  emailTestMessage.value = null
  try {
    const response = await $fetch('/api/settings/email-test', {
      method: 'POST',
      body: { to: emailTestTarget.value.trim() }
    })
    if ((response as any)?.ok) {
      emailTestMessage.value = { type: 'success', text: 'Email de prueba enviado.' }
    } else {
      emailTestMessage.value = { type: 'error', text: (response as any)?.error || 'No se pudo enviar el email de prueba.' }
    }
  } catch (e: any) {
    emailTestMessage.value = { type: 'error', text: e?.data?.statusMessage || 'No se pudo enviar el email de prueba.' }
  } finally {
    emailTestLoading.value = false
  }
}

async function loadEmailTemplate() {
  emailTemplateLoading.value = true
  emailTemplateMessage.value = null
  try {
    const response = await $fetch('/api/settings/email-template')
    emailTemplate.value = (response as any)?.template || ''
  } catch (e: any) {
    emailTemplateMessage.value = { type: 'error', text: e?.data?.statusMessage || 'No se pudo cargar el template HTML de email.' }
  } finally {
    emailTemplateLoading.value = false
  }
}

async function saveEmailTemplate() {
  if (!emailTemplate.value.trim()) return
  emailTemplateSaving.value = true
  emailTemplateMessage.value = null
  try {
    await $fetch('/api/settings/email-template', {
      method: 'PATCH',
      body: { template: emailTemplate.value }
    })
    emailTemplateMessage.value = { type: 'success', text: 'Template HTML de email guardado.' }
  } catch (e: any) {
    emailTemplateMessage.value = { type: 'error', text: e?.data?.statusMessage || 'No se pudo guardar el template HTML de email.' }
  } finally {
    emailTemplateSaving.value = false
  }
}

onMounted(() => {
  void Promise.all([loadEmailStatus(), loadEmailTemplate(), loadWhatsappTemplate()])
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">{{ $t('pages.private.managerSettings') }}</h1>
      <p class="text-sm text-gray-600">{{ $t('pages.private.managerSettingsNav.emailDesc') }}</p>
    </div>

    <BackofficeSettingsNav />

    <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-sm font-semibold text-gray-900">{{ $t('pages.settings.email.sectionTitle') }}</div>
          <div class="text-xs text-gray-500">{{ $t('pages.settings.email.sectionSubtitle') }}</div>
        </div>
      </div>

      <div v-if="emailStatusLoading" class="mt-2 text-xs text-gray-500">{{ $t('common.loading') }}</div>
      <div v-if="emailStatusError" class="mt-2 text-xs text-red-600">{{ emailStatusError }}</div>

      <div v-if="emailStatus" class="mt-3 grid gap-3 sm:grid-cols-2">
        <div class="rounded border border-gray-200 px-3 py-2">
          <div class="text-xs text-gray-500">{{ $t('pages.settings.email.providerActive') }}</div>
          <div class="text-sm font-medium text-gray-900">
            {{ emailStatus.providerActive ? (emailStatus.provider || $t('common.active')) : $t('pages.settings.email.notConfigured') }}
          </div>
        </div>
        <div class="rounded border border-gray-200 px-3 py-2">
          <div class="text-xs text-gray-500">{{ $t('pages.settings.email.fromLabel') }}</div>
          <div class="text-sm font-medium text-gray-900">{{ emailStatus.from || '—' }}</div>
        </div>
        <div class="rounded border border-gray-200 px-3 py-2">
          <div class="text-xs text-gray-500">{{ $t('pages.settings.email.replyToLabel') }}</div>
          <div class="text-sm font-medium text-gray-900">{{ emailStatus.replyTo || '—' }}</div>
        </div>
        <div class="rounded border border-gray-200 px-3 py-2">
          <div class="text-xs text-gray-500">{{ $t('pages.settings.email.confirmationsLabel') }}</div>
          <div class="text-sm font-medium text-gray-900">
            {{ emailStatus.confirmation.enabled ? $t('pages.settings.email.enabled') : $t('pages.settings.email.disabled') }}
          </div>
          <div v-if="emailStatus.confirmation.note" class="text-xs text-gray-500">
            {{ emailStatus.confirmation.note }}
          </div>
        </div>
      </div>

      <div class="mt-4 border-t border-gray-200 pt-4 space-y-4">
        <div>
          <div class="text-sm font-semibold text-gray-900">Template HTML de Email</div>
          <div class="text-xs text-gray-500">Placeholders disponibles: <span v-pre>{{name}}, {{date}}, {{branch}}, {{services}}, {{confirm_url}}, {{expires_at}}</span></div>
          <textarea
            v-model="emailTemplate"
            class="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm min-h-[180px] font-mono"
            :disabled="emailTemplateLoading"
          />
          <div class="mt-2 flex justify-end">
            <UButton color="primary" :loading="emailTemplateSaving" :disabled="!emailTemplate.trim()" @click="saveEmailTemplate">
              Guardar template HTML
            </UButton>
          </div>
          <div v-if="emailTemplateMessage" class="mt-2 text-xs" :class="emailTemplateMessage.type === 'success' ? 'text-green-700' : 'text-red-600'">
            {{ emailTemplateMessage.text }}
          </div>

          <div class="mt-4">
            <div class="text-xs font-medium text-gray-600">Previsualización</div>
            <div class="mt-2 rounded border border-gray-300 overflow-hidden bg-white">
              <iframe
                class="w-full h-[380px]"
                :srcdoc="emailTemplatePreview"
                sandbox="allow-same-origin"
                title="Email template preview"
              />
            </div>
          </div>
        </div>

        <div>
          <div class="text-sm font-semibold text-gray-900">{{ $t('pages.settings.email.whatsappTemplateTitle') }}</div>
          <div class="text-xs text-gray-500">{{ $t('pages.settings.email.whatsappPlaceholders', placeholderVars) }}</div>
          <textarea
            v-model="whatsappTemplate"
            class="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm min-h-[96px]"
            :disabled="whatsappTemplateLoading"
          />
          <div class="mt-2 flex justify-end">
            <UButton color="primary" :loading="whatsappTemplateSaving" :disabled="!whatsappTemplate.trim()" @click="saveWhatsappTemplate">
              {{ $t('pages.settings.email.saveWhatsappTemplate') }}
            </UButton>
          </div>
          <div v-if="whatsappTemplateMessage" class="mt-2 text-xs" :class="whatsappTemplateMessage.type === 'success' ? 'text-green-700' : 'text-red-600'">
            {{ whatsappTemplateMessage.text }}
          </div>
        </div>

        <div class="border-t border-gray-200 pt-4">
          <div class="text-sm font-semibold text-gray-900">{{ $t('pages.settings.email.testEmailTitle') }}</div>
          <div class="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              v-model="emailTestTarget"
              type="email"
              class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <UButton color="primary" :disabled="!emailTestTarget.trim()" :loading="emailTestLoading" @click="sendTestEmail">
              {{ $t('pages.settings.email.sendTestEmail') }}
            </UButton>
          </div>
          <div v-if="emailTestMessage" class="mt-2 text-xs" :class="emailTestMessage.type === 'success' ? 'text-green-700' : 'text-red-600'">
            {{ emailTestMessage.text }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
