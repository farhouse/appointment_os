<script setup lang="ts">
definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['OWNER', 'ADMIN', 'MANAGER'],
})

const { t } = useI18n()

type NewsOffer = {
  id: string
  title: string
  body: string
  active: boolean
  startsAt?: string | null
  endsAt?: string | null
}

const rows = ref<NewsOffer[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const editingId = ref<string | null>(null)

const form = reactive({
  title: '',
  body: '',
  active: true,
  startsAt: '',
  endsAt: ''
})

async function loadRows() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    rows.value = await $fetch('/api/settings/news-offers')
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage || t('admin.common.loadError')
  } finally {
    isLoading.value = false
  }
}

function resetForm() {
  editingId.value = null
  form.title = ''
  form.body = ''
  form.active = true
  form.startsAt = ''
  form.endsAt = ''
}

function editRow(row: NewsOffer) {
  editingId.value = row.id
  form.title = row.title
  form.body = row.body
  form.active = row.active
  form.startsAt = row.startsAt ? row.startsAt.slice(0, 16) : ''
  form.endsAt = row.endsAt ? row.endsAt.slice(0, 16) : ''
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : null
}

async function saveRow() {
  if (!form.title.trim() || !form.body.trim()) return
  isSaving.value = true
  try {
    const body = {
      title: form.title.trim(),
      body: form.body.trim(),
      active: form.active,
      startsAt: toIso(form.startsAt),
      endsAt: toIso(form.endsAt)
    }
    if (editingId.value) {
      await $fetch(`/api/settings/news-offers/${editingId.value}`, { method: 'PATCH', body })
    } else {
      await $fetch('/api/settings/news-offers', { method: 'POST', body })
    }
    resetForm()
    await loadRows()
  } finally {
    isSaving.value = false
  }
}

async function deleteRow(id: string) {
  await $fetch(`/api/settings/news-offers/${id}`, { method: 'DELETE' })
  await loadRows()
}

onMounted(loadRows)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">Settings</h1>
      <p class="text-sm text-gray-600">Novedades y promociones visibles para clientes.</p>
    </div>

    <BackofficeSettingsNav />

    <section class="grid gap-4 lg:grid-cols-[360px_1fr]">
      <div class="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div class="text-sm font-semibold text-stone-900">{{ editingId ? 'Editar promo' : 'Nueva promo' }}</div>
        <div class="mt-4 space-y-3">
          <UInput v-model="form.title" placeholder="Título" />
          <UTextarea v-model="form.body" placeholder="Descripción" :rows="5" />
          <UCheckbox v-model="form.active" label="Activa" />
          <UInput v-model="form.startsAt" type="datetime-local" />
          <UInput v-model="form.endsAt" type="datetime-local" />
          <div class="flex gap-2">
            <UButton color="primary" :loading="isSaving" @click="saveRow">Guardar</UButton>
            <UButton variant="outline" @click="resetForm">Limpiar</UButton>
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-stone-200 bg-white shadow-sm">
        <div v-if="isLoading" class="p-6">
          <USkeleton class="h-8 w-full" />
        </div>
        <div v-else-if="errorMessage" class="p-6 text-sm text-rose-600">{{ errorMessage }}</div>
        <div v-else-if="!rows.length" class="p-6 text-sm text-stone-600">Sin novedades cargadas.</div>
        <div v-else class="divide-y divide-stone-200">
          <div v-for="row in rows" :key="row.id" class="flex flex-wrap items-start justify-between gap-3 p-4">
            <div class="min-w-0">
              <div class="font-medium text-stone-900">{{ row.title }}</div>
              <div class="mt-1 text-sm text-stone-600">{{ row.body }}</div>
              <UBadge class="mt-2" :color="row.active ? 'success' : 'neutral'" variant="subtle">
                {{ row.active ? 'Activa' : 'Inactiva' }}
              </UBadge>
            </div>
            <div class="flex gap-2">
              <UButton size="xs" variant="outline" @click="editRow(row)">Editar</UButton>
              <UButton size="xs" color="error" variant="outline" @click="deleteRow(row.id)">Borrar</UButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
