<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const toast = useToast()

const isLoading = ref(true)
const isSaving = ref(false)

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters')
})

type Form = z.output<typeof schema>

const state = reactive<Partial<Form>>({
  name: '',
  email: '',
  password: ''
})

const formRef = useTemplateRef('setupForm')

async function check() {
  try {
    const res = await $fetch<{ needsSetup: boolean }>('/api/setup/status')
    if (!res.needsSetup) {
      await navigateTo('/login')
      return
    }
  } finally {
    isLoading.value = false
  }
}

async function submit(event: FormSubmitEvent<Form>) {
  isSaving.value = true
  try {
    await $fetch('/api/setup/init', { method: 'POST', body: event.data })

    // Auto-login after setup
    await $fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      body: { email: event.data.email, password: event.data.password }
    })

    toast.add({ title: t('setup.success') || 'Owner created', color: 'success' })

    if (process.client) {
      window.location.assign('/private')
      return
    }

    await navigateTo('/private', { external: true })
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || t('admin.common.saveError') || 'Error', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  void check()
})
</script>

<template>
  <div class="mx-auto w-full max-w-md space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-stone-900">{{ t('setup.title') || 'Initial setup' }}</h1>
      <p class="text-sm text-stone-600">{{ t('setup.subtitle') || 'Create the first OWNER user to start using the app.' }}</p>
    </div>

    <div v-if="isLoading" class="rounded-lg border border-stone-200 bg-white p-6">
      <USkeleton class="h-8 w-full" />
      <USkeleton class="mt-3 h-8 w-full" />
      <USkeleton class="mt-3 h-8 w-full" />
    </div>

    <div v-else class="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
      <UForm ref="setupForm" :schema="schema" :state="state" class="space-y-4" @submit="submit">
        <UFormField :label="t('setup.name') || 'Name'" name="name">
          <UInput v-model="state.name" />
        </UFormField>

        <UFormField :label="t('setup.email') || 'Email'" name="email">
          <UInput v-model="state.email" type="email" />
        </UFormField>

        <UFormField :label="t('setup.password') || 'Password'" name="password">
          <UInput v-model="state.password" type="password" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton color="primary" :loading="isSaving" @click="formRef?.submit()">
            {{ t('setup.create') || 'Create owner' }}
          </UButton>
        </div>
      </UForm>
    </div>
  </div>
</template>
