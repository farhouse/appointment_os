<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
      <h1 class="text-2xl font-bold text-center">{{ $t('login.title') }}</h1>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">{{ $t('login.email') }}</label>
          <input v-model="email" type="email" required class="w-full px-3 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">{{ $t('login.password') }}</label>
          <input v-model="password" type="password" required class="w-full px-3 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <button type="submit" class="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">{{ $t('login.submit') }}</button>
        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const email = ref('')
const password = ref('')
const error = ref('')
const { t } = useI18n()
const router = useRouter()
const route = useRoute()

async function handleLogin() {
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value }
    })

    // Prevent stale role/menu on repeated logins (e.g. switching users)
    useState('me', () => null).value = null

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/private'
    router.push(redirect)
  } catch (e: any) {
    error.value = e.data?.statusMessage || t('login.error')
  }
}
</script>
