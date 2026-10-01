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

function formatDate(value?: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function scheduleLabel(row: NewsOffer) {
  const start = formatDate(row.startsAt)
  const end = formatDate(row.endsAt)
  if (start && end) return `${start} — ${end}`
  if (start) return `Desde ${start}`
  if (end) return `Hasta ${end}`
  return 'Sin programación'
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
    <div class="max-w-3xl">
      <h1 class="text-2xl font-semibold text-[#17233c]">Novedades y promociones</h1>
      <p class="mt-1 text-sm text-[#627087]">Publicá anuncios visibles para clientes y definí cuándo deben mostrarse.</p>
    </div>

    <BackofficeSettingsNav />

    <section class="grid items-start gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
      <div class="overflow-hidden rounded-lg border border-[#d9e1ea] bg-white">
        <div class="border-b border-[#d9e1ea] px-4 py-3">
          <h2 class="text-base font-semibold text-[#17233c]">{{ editingId ? 'Editar publicación' : 'Nueva publicación' }}</h2>
          <p class="mt-0.5 text-xs text-[#627087]">Título, mensaje y período de visibilidad.</p>
        </div>

        <div class="space-y-4 p-4">
          <UFormField label="Título" required>
            <UInput v-model="form.title" class="w-full" placeholder="Ej. Beneficio de primavera" />
          </UFormField>

          <UFormField label="Descripción" required>
            <UTextarea v-model="form.body" class="w-full" placeholder="Contá los detalles de la novedad o promoción." :rows="5" autoresize />
          </UFormField>

          <div class="rounded-md border border-[#d9e1ea] bg-[#f6f8fb] px-3 py-2.5">
            <UCheckbox v-model="form.active" label="Publicación activa" description="Puede mostrarse a clientes dentro del período configurado." />
          </div>

          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <UFormField label="Visible desde">
              <UInput v-model="form.startsAt" class="w-full" type="datetime-local" />
            </UFormField>
            <UFormField label="Visible hasta">
              <UInput v-model="form.endsAt" class="w-full" type="datetime-local" />
            </UFormField>
          </div>

          <p class="text-xs leading-5 text-[#627087]">Si no elegís fechas, la publicación no tendrá límite de vigencia.</p>
        </div>

        <div class="flex items-center justify-end gap-2 border-t border-[#d9e1ea] bg-[#f6f8fb] px-4 py-3">
          <UButton color="neutral" variant="ghost" @click="resetForm">{{ editingId ? 'Cancelar' : 'Limpiar' }}</UButton>
          <UButton color="primary" icon="i-lucide-save" :loading="isSaving" :disabled="!form.title.trim() || !form.body.trim()" @click="saveRow">
            {{ editingId ? 'Guardar cambios' : 'Publicar' }}
          </UButton>
        </div>
      </div>

      <div class="overflow-hidden rounded-lg border border-[#d9e1ea] bg-white">
        <div class="flex items-center justify-between gap-4 border-b border-[#d9e1ea] px-4 py-3">
          <div>
            <h2 class="text-base font-semibold text-[#17233c]">Publicaciones</h2>
            <p class="mt-0.5 text-xs text-[#627087]">Administrá el contenido que reciben tus clientes.</p>
          </div>
          <UBadge color="neutral" variant="subtle">{{ rows.length }}</UBadge>
        </div>

        <div v-if="isLoading" class="p-6">
          <div class="space-y-3">
            <USkeleton class="h-5 w-48" />
            <USkeleton class="h-16 w-full" />
            <USkeleton class="h-16 w-full" />
          </div>
        </div>
        <div v-else-if="errorMessage" class="flex items-center gap-2 p-6 text-sm text-[#d45a55]">
          <UIcon name="i-lucide-circle-alert" class="size-4 shrink-0" />
          {{ errorMessage }}
        </div>
        <div v-else-if="!rows.length" class="flex min-h-64 flex-col items-center justify-center px-6 text-center">
          <UIcon name="i-lucide-megaphone" class="size-8 text-[#627087]" />
          <p class="mt-3 text-sm font-medium text-[#17233c]">Todavía no hay publicaciones</p>
          <p class="mt-1 max-w-sm text-xs leading-5 text-[#627087]">Creá una novedad o promoción para mantener informados a tus clientes.</p>
        </div>
        <div v-else class="divide-y divide-[#d9e1ea]">
          <article v-for="row in rows" :key="row.id" class="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-semibold text-[#17233c]">{{ row.title }}</h3>
                <UBadge :color="row.active ? 'success' : 'neutral'" variant="subtle">
                  {{ row.active ? 'Activa' : 'Inactiva' }}
                </UBadge>
              </div>
              <p class="mt-1 max-w-3xl whitespace-pre-line text-sm leading-5 text-[#627087]">{{ row.body }}</p>
              <div class="mt-3 flex items-center gap-1.5 text-xs text-[#627087]">
                <UIcon name="i-lucide-calendar-clock" class="size-3.5 shrink-0" />
                <span>{{ scheduleLabel(row) }}</span>
              </div>
            </div>
            <div class="flex gap-1 sm:justify-end">
              <UButton size="sm" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="editRow(row)">Editar</UButton>
              <UButton size="sm" color="error" variant="ghost" icon="i-lucide-trash-2" @click="deleteRow(row.id)">Borrar</UButton>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>
