<template>
  <section class="w-full max-w-md overflow-hidden rounded-lg border border-[#d9e1ea] bg-white">
    <div class="border-b border-[#edf1f6] px-6 py-6 sm:px-8">
      <p class="text-xs font-semibold uppercase text-[#627087]">Acceso seguro</p>
      <h1 class="mt-1 font-serif text-3xl font-semibold text-[#17233c]">{{ $t('login.title') }}</h1>
      <p class="mt-2 text-sm text-[#627087]">Ingresá para continuar con la operación de tu negocio.</p>
    </div>

    <div class="px-6 py-6 sm:px-8">
      <div v-if="checkingSetup" class="space-y-4" aria-label="Comprobando configuración">
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
      </div>

      <form v-else class="space-y-5" @submit.prevent="handleLogin">
        <div>
          <label for="login-email" class="block text-sm font-semibold text-[#344158]">{{ $t('login.email') }}</label>
          <input id="login-email" v-model="email" type="email" autocomplete="email" required class="mt-2 h-10 w-full rounded-md border border-[#d9e1ea] bg-white px-3 text-sm text-[#17233c] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]" />
        </div>
        <div>
          <label for="login-password" class="block text-sm font-semibold text-[#344158]">{{ $t('login.password') }}</label>
          <input id="login-password" v-model="password" type="password" autocomplete="current-password" required class="mt-2 h-10 w-full rounded-md border border-[#d9e1ea] bg-white px-3 text-sm text-[#17233c] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]" />
        </div>

        <p v-if="error" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{{ error }}</p>

        <button type="submit" class="h-10 w-full rounded-md bg-[#2563eb] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#93c5fd] focus:ring-offset-2">{{ $t('login.submit') }}</button>
        <NuxtLink to="/" class="flex h-10 w-full items-center justify-center rounded-md border border-[#d9e1ea] bg-white px-4 text-sm font-semibold text-[#344158] transition hover:bg-[#f6f8fb] focus:outline-none focus:ring-2 focus:ring-[#93c5fd]">
          Volver al inicio
        </NuxtLink>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const email = ref('')
const password = ref('')
const error = ref('')
const { t } = useI18n()
const route = useRoute()

const checkingSetup = ref(true)

onMounted(async () => {
  try {
    const res = await $fetch<{ needsSetup: boolean }>('/api/setup/status')
    if (res.needsSetup) {
      await navigateTo('/setup')
      return
    }
  } catch {
    // ignore
  } finally {
    checkingSetup.value = false
  }
})

async function handleLogin() {
  try {
    const res = await $fetch<{ user: any }>('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      body: { email: email.value, password: password.value }
    })

    // Set session state immediately so route middleware doesn't race the cookie write
    // (cookie is still the source of truth for the API)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useState<any>('me', () => null).value = res?.user ?? null

    const redirectRaw = typeof route.query.redirect === 'string' ? route.query.redirect : '/private'
    const redirect = decodeURIComponent(redirectRaw)

    // Avoid open-redirects / weird malformed paths
    const target = redirect.startsWith('/') ? redirect : '/private'

    // Force a full navigation so cookie-based auth is definitely available.
    // Using location.assign avoids edge cases where SPA navigation gets stuck.
    if (process.client) {
      window.location.assign(target)
      return
    }

    await navigateTo(target, { external: true })
  } catch (e: any) {
    error.value = e.data?.statusMessage || t('login.error')
  }
}
</script>
