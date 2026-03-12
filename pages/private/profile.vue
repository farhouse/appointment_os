<script setup lang="ts">
import { loadMe, useMeState } from '~/composables/useMe'

definePageMeta({
  layout: 'private',
  middleware: ['private'],
})

await loadMe()
const me = useMeState()
const toast = useToast()

const profileForm = reactive({
  name: String(me.value?.name || ''),
  email: String(me.value?.email || ''),
  phone: String(me.value?.phone || ''),
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const isSavingProfile = ref(false)
const isSavingPassword = ref(false)

async function saveProfile() {
  isSavingProfile.value = true
  try {
    const res = await $fetch('/api/me', {
      method: 'PATCH',
      body: {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone || null,
      }
    })

    if (res?.user) {
      me.value = { ...me.value, ...res.user }
    }

    toast.add({ title: 'Perfil actualizado', color: 'success' })
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || 'No se pudo actualizar el perfil', color: 'error' })
  } finally {
    isSavingProfile.value = false
  }
}

async function changePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toast.add({ title: 'Las contraseñas no coinciden', color: 'error' })
    return
  }

  isSavingPassword.value = true
  try {
    await $fetch('/api/me/password', {
      method: 'POST',
      body: {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }
    })

    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    toast.add({ title: 'Contraseña actualizada', color: 'success' })
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || 'No se pudo actualizar la contraseña', color: 'error' })
  } finally {
    isSavingPassword.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">{{ $t('pages.private.profileTitle') }}</h1>
      <p class="text-sm text-gray-600">{{ $t('pages.private.profileSubtitle') }}</p>
    </div>

    <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm text-gray-900 space-y-4">
      <h2 class="font-medium">Datos de cuenta</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <UFormGroup :label="$t('pages.private.profile.name')">
          <UInput v-model="profileForm.name" />
        </UFormGroup>
        <UFormGroup :label="$t('pages.private.profile.email')">
          <UInput v-model="profileForm.email" type="email" />
        </UFormGroup>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <UFormGroup :label="$t('pages.private.profile.phone')">
          <UInput v-model="profileForm.phone" />
        </UFormGroup>
        <UFormGroup :label="$t('pages.private.profile.role')">
          <UInput :model-value="me?.role" disabled />
        </UFormGroup>
      </div>

      <div class="flex justify-end">
        <UButton :loading="isSavingProfile" @click="saveProfile">Guardar perfil</UButton>
      </div>
    </div>

    <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm text-gray-900 space-y-4">
      <h2 class="font-medium">Cambiar contraseña</h2>

      <div class="grid gap-4 md:grid-cols-3">
        <UFormGroup label="Contraseña actual">
          <UInput v-model="passwordForm.currentPassword" type="password" />
        </UFormGroup>
        <UFormGroup label="Nueva contraseña">
          <UInput v-model="passwordForm.newPassword" type="password" />
        </UFormGroup>
        <UFormGroup label="Confirmar nueva contraseña">
          <UInput v-model="passwordForm.confirmPassword" type="password" />
        </UFormGroup>
      </div>

      <div class="flex justify-end">
        <UButton color="gray" :loading="isSavingPassword" @click="changePassword">Actualizar contraseña</UButton>
      </div>
    </div>
  </div>
</template>
