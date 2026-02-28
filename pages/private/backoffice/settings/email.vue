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

async function loadEmailStatus() {
  emailStatusLoading.value = true
  emailStatusError.value = ''
  try {
    emailStatus.value = await $fetch('/api/settings/email')
  } catch (e: any) {
    emailStatus.value = null
    emailStatusError.value = e?.data?.statusMessage || 'No se pudo cargar'
  } finally {
    emailStatusLoading.value = false
  }
}

async function sendTestEmail() {
  const target = emailTestTarget.value.trim()
  if (!target) return
  emailTestLoading.value = true
  emailTestMessage.value = null
  try {
    const response = await $fetch('/api/settings/email-test', {
      method: 'POST',
      body: { to: target }
    })
    if (response?.ok) {
      emailTestMessage.value = { type: 'success', text: 'Email de prueba enviado.' }
    } else {
      emailTestMessage.value = { type: 'error', text: response?.error || 'No se pudo enviar.' }
    }
  } catch (e: any) {
    emailTestMessage.value = { type: 'error', text: e?.data?.statusMessage || 'No se pudo enviar.' }
  } finally {
    emailTestLoading.value = false
  }
}

onMounted(() => {
  void loadEmailStatus()
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
          <div class="text-sm font-semibold text-gray-900">Email / Confirmaciones</div>
          <div class="text-xs text-gray-500">Visibilidad segura de configuración y prueba de envío.</div>
        </div>
      </div>

      <div v-if="emailStatusLoading" class="mt-2 text-xs text-gray-500">{{ $t('common.loading') }}</div>
      <div v-if="emailStatusError" class="mt-2 text-xs text-red-600">{{ emailStatusError }}</div>

      <div v-if="emailStatus" class="mt-3 grid gap-3 sm:grid-cols-2">
        <div class="rounded border border-gray-200 px-3 py-2">
          <div class="text-xs text-gray-500">Proveedor activo</div>
          <div class="text-sm font-medium text-gray-900">
            {{ emailStatus.providerActive ? (emailStatus.provider || 'Activo') : 'No configurado' }}
          </div>
        </div>
        <div class="rounded border border-gray-200 px-3 py-2">
          <div class="text-xs text-gray-500">From</div>
          <div class="text-sm font-medium text-gray-900">{{ emailStatus.from || '—' }}</div>
        </div>
        <div class="rounded border border-gray-200 px-3 py-2">
          <div class="text-xs text-gray-500">Reply-To</div>
          <div class="text-sm font-medium text-gray-900">{{ emailStatus.replyTo || '—' }}</div>
        </div>
        <div class="rounded border border-gray-200 px-3 py-2">
          <div class="text-xs text-gray-500">Confirmaciones</div>
          <div class="text-sm font-medium text-gray-900">
            {{ emailStatus.confirmation.enabled ? 'Habilitadas' : 'Deshabilitadas' }}
          </div>
          <div v-if="emailStatus.confirmation.note" class="text-xs text-gray-500">
            {{ emailStatus.confirmation.note }}
          </div>
        </div>
      </div>

      <div class="mt-4 border-t border-gray-200 pt-4">
        <div class="text-sm font-semibold text-gray-900">Enviar email de prueba</div>
        <div class="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            v-model="emailTestTarget"
            type="email"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="correo@dominio.com"
          />
          <UButton color="primary" :disabled="!emailTestTarget.trim()" :loading="emailTestLoading" @click="sendTestEmail">
            Enviar email de prueba
          </UButton>
        </div>
        <div v-if="emailTestMessage" class="mt-2 text-xs" :class="emailTestMessage.type === 'success' ? 'text-green-700' : 'text-red-600'">
          {{ emailTestMessage.text }}
        </div>
      </div>
    </div>
  </div>
</template>
