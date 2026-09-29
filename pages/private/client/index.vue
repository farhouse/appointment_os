<script setup lang="ts">
import { loadMe } from '~/composables/useMe'

type Appointment = {
  id: string
  status: string
  startTime: string
  endTime: string
  branch: { id: string; name: string }
  professional?: { id: string; name: string } | null
  services: { service: { id: string; name: string } }[]
}

type PointsSummary = {
  balance: number
}

type ClientPhoto = {
  id: string
  url: string
  filename: string
}

type NewsOffer = {
  id: string
  title: string
  body: string
}

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['CLIENT'],
})

const { data: me, pending: isLoadingMe } = await useAsyncData('client-dashboard-me', () => loadMe(), { server: false })
const { data: pointsSummary, pending: isLoadingPoints, error: pointsError } = await useAsyncData(
  'client-dashboard-points',
  () => $fetch<PointsSummary>('/api/client/points'),
  { server: false }
)
const { data: appointments, pending: isLoadingAppointments, error: appointmentsError } = await useAsyncData(
  'client-dashboard-appointments',
  () => $fetch<Appointment[]>('/api/client/appointments'),
  { server: false }
)
const { data: clientPhotos, pending: isLoadingPhotos, refresh: refreshPhotos } = await useAsyncData(
  'client-dashboard-photos',
  () => $fetch<ClientPhoto[]>('/api/client/photos'),
  { server: false, default: () => [] }
)
const { data: newsOffers, pending: isLoadingNews } = await useAsyncData(
  'client-dashboard-news-offers',
  () => $fetch<NewsOffer[]>('/api/public/news-offers'),
  { server: false, default: () => [] }
)

const { formatDateTime, statusColor, statusLabel } = useAppointmentStatus()

const greetingName = computed(() => {
  const name = me.value?.name || ''
  if (!name.trim()) return 'cliente'
  return name.split(' ')[0] || name
})

const now = computed(() => new Date())

const sortedAppointments = computed(() => {
  return [...(appointments.value || [])].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
})

const upcomingAppointments = computed(() => {
  return sortedAppointments.value.filter(apt => new Date(apt.startTime) >= now.value)
})

const nextAppointment = computed(() => upcomingAppointments.value[0])

const recentAppointments = computed(() => {
  return [...(appointments.value || [])]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 3)
})

const lastAppointment = computed(() => recentAppointments.value.find(apt => new Date(apt.startTime) < now.value))
const rebookUrl = computed(() => {
  if (!lastAppointment.value) return '/private/client/book'
  const query = new URLSearchParams()
  if (lastAppointment.value.branch?.id) query.set('branchId', lastAppointment.value.branch.id)
  if (lastAppointment.value.professional?.id) query.set('workerId', lastAppointment.value.professional.id)
  const firstServiceId = lastAppointment.value.services?.[0]?.service?.id
  if (firstServiceId) query.set('serviceId', firstServiceId)
  const suffix = query.toString()
  return suffix ? `/private/client/book?${suffix}` : '/private/client/book'
})

const isLoading = computed(() => isLoadingMe.value || isLoadingPoints.value || isLoadingAppointments.value)
const photoInput = ref<HTMLInputElement | null>(null)
const isUploadingPhoto = ref(false)
const photoError = ref('')
const canUploadPhoto = computed(() => (clientPhotos.value?.length || 0) < 3)

async function uploadPhoto(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  photoError.value = ''
  isUploadingPhoto.value = true
  try {
    const form = new FormData()
    form.append('photo', file)
    await $fetch('/api/client/photos', { method: 'POST', body: form })
    await refreshPhotos()
  } catch (e: any) {
    photoError.value = e?.data?.statusMessage || 'No pudimos subir la foto.'
  } finally {
    isUploadingPhoto.value = false
    input.value = ''
  }
}

async function deletePhoto(id: string) {
  photoError.value = ''
  try {
    await $fetch(`/api/client/photos/${id}`, { method: 'DELETE' })
    await refreshPhotos()
  } catch (e: any) {
    photoError.value = e?.data?.statusMessage || 'No pudimos borrar la foto.'
  }
}
</script>

<template>
  <div class="space-y-8">
    <section class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold">Hola, {{ greetingName }}</h1>
          <div v-if="isLoadingMe" class="mt-2">
            <USkeleton class="h-4 w-56" />
          </div>
          <p v-else class="text-sm text-stone-600">Tu panel de cliente para gestionar turnos, puntos y novedades.</p>
        </div>
        <div class="flex gap-2">
          <UButton to="/private/client/book" color="primary">Reservar turno</UButton>
          <UButton to="/private/client/appointments" variant="outline">Ver mis turnos</UButton>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div class="text-xs uppercase tracking-wide text-stone-500">Puntos disponibles</div>
          <div v-if="isLoadingPoints" class="mt-3 space-y-2">
            <USkeleton class="h-6 w-20" />
            <USkeleton class="h-4 w-32" />
          </div>
          <div v-else-if="pointsError" class="mt-3 text-sm text-rose-600">No pudimos cargar tus puntos.</div>
          <div v-else class="mt-3">
            <div class="text-2xl font-semibold text-stone-900">{{ pointsSummary?.balance ?? 0 }}</div>
            <div class="text-xs text-stone-500">Sumás puntos con cada visita y canjeás en recompensas.</div>
          </div>
        </div>

        <div class="rounded-lg border border-black/10 bg-white p-4 shadow-sm md:col-span-2">
          <div class="text-xs uppercase tracking-wide text-stone-500">Próximo turno</div>
          <div v-if="isLoadingAppointments" class="mt-3 space-y-2">
            <USkeleton class="h-5 w-48" />
            <USkeleton class="h-4 w-64" />
          </div>
          <div v-else-if="appointmentsError" class="mt-3 text-sm text-rose-600">No pudimos cargar tus turnos.</div>
          <div v-else-if="!nextAppointment" class="mt-3">
            <div class="text-base font-semibold text-stone-900">No tenés turnos próximos</div>
            <div class="mt-1 text-sm text-stone-600">Reservá ahora para asegurar tu lugar en agenda.</div>
          </div>
          <div v-else class="mt-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="text-base font-semibold text-stone-900">{{ formatDateTime(nextAppointment.startTime) }}</div>
                <div class="text-sm text-stone-600">
                  {{ nextAppointment.branch?.name || 'Sucursal por confirmar' }} ·
                  {{ nextAppointment.professional?.name || 'Profesional por asignar' }}
                </div>
              </div>
              <UBadge :color="statusColor(nextAppointment.status)" variant="subtle">
                {{ statusLabel(nextAppointment.status) }}
              </UBadge>
            </div>
            <div class="mt-2 text-sm text-stone-600">
              {{ nextAppointment.services.map(s => s.service.name).join(', ') || 'Servicio por definir' }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-4 lg:grid-cols-3">
      <div class="space-y-4 lg:col-span-2">
        <div class="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-base font-semibold text-stone-900">Novedades y promos</div>
              <div class="mt-1 text-sm text-stone-600">Enterate primero de combos, beneficios y descuentos personalizados para clientes frecuentes.</div>
            </div>
          </div>
          <div v-if="isLoadingNews" class="mt-4 space-y-2">
            <USkeleton class="h-5 w-full" />
            <USkeleton class="h-5 w-4/5" />
          </div>
          <div v-else-if="newsOffers?.length" class="mt-4 space-y-3">
            <div v-for="offer in newsOffers" :key="offer.id" class="rounded-md border border-stone-200 bg-stone-50 p-3">
              <div class="font-medium text-stone-900">{{ offer.title }}</div>
              <div class="mt-1 text-sm text-stone-600">{{ offer.body }}</div>
            </div>
          </div>
          <div v-else class="mt-4 rounded-md border border-dashed border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
            No hay promociones activas en este momento.
          </div>
        </div>

        <div class="rounded-lg border border-stone-200 bg-white shadow-sm">
          <div class="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
            <div>
              <div class="text-sm font-semibold text-stone-900">Últimos turnos</div>
              <div class="text-xs text-stone-500">Resumen rápido de tu historial reciente.</div>
            </div>
            <UButton to="/private/client/appointments" variant="ghost" size="xs">Ver todo</UButton>
          </div>
          <div v-if="isLoadingAppointments" class="p-6 space-y-3">
            <USkeleton class="h-5 w-full" />
            <USkeleton class="h-5 w-5/6" />
            <USkeleton class="h-5 w-4/6" />
          </div>
          <div v-else-if="appointmentsError" class="p-6">
            <CrudState
              title="No pudimos cargar tus turnos"
              description="Reintentá en unos minutos o refrescá la página."
              icon="i-lucide-alert-triangle"
              action-label="Reintentar"
              @action="refreshNuxtData('client-dashboard-appointments')"
            />
          </div>
          <div v-else-if="recentAppointments.length === 0" class="p-6">
            <CrudState
              title="Todavía no hay turnos registrados"
              description="Cuando reserves, vas a ver tus últimas visitas acá con todos los detalles."
              icon="i-lucide-calendar"
            />
          </div>
          <div v-else class="divide-y divide-stone-200">
            <div v-for="apt in recentAppointments" :key="apt.id" class="p-4 sm:p-5">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div class="text-sm text-stone-500">{{ formatDateTime(apt.startTime) }}</div>
                  <div class="text-base font-semibold text-stone-900">{{ apt.branch?.name || 'Sucursal por confirmar' }}</div>
                  <div class="text-sm text-stone-600">
                    {{ apt.services.map(s => s.service.name).join(', ') || 'Servicio por definir' }}
                  </div>
                </div>
                <UBadge :color="statusColor(apt.status)" variant="subtle">
                  {{ statusLabel(apt.status) }}
                </UBadge>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div class="text-sm font-semibold text-stone-900">Rebook rápido</div>
          <div class="mt-1 text-sm text-stone-600">Repetí tu último servicio en pocos pasos.</div>
          <div class="mt-4 space-y-2">
            <div class="rounded-md border border-dashed border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
              Última visita: {{ lastAppointment ? formatDateTime(lastAppointment.startTime) : 'Sin historial' }}
            </div>
            <UButton :to="rebookUrl" color="primary" block>Reservar de nuevo</UButton>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="text-sm font-semibold text-stone-900">Fotos de cortes</div>
              <div class="mt-1 text-sm text-stone-600">Guardá hasta 3 referencias para futuras visitas.</div>
            </div>
            <UButton
              size="xs"
              variant="outline"
              :loading="isUploadingPhoto"
              :disabled="!canUploadPhoto"
              @click="photoInput?.click()"
            >
              Subir
            </UButton>
            <input ref="photoInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="uploadPhoto" />
          </div>
          <div v-if="photoError" class="mt-3 text-xs text-rose-600">{{ photoError }}</div>
          <div v-if="isLoadingPhotos" class="mt-4 grid grid-cols-3 gap-2">
            <USkeleton class="aspect-square rounded" />
            <USkeleton class="aspect-square rounded" />
            <USkeleton class="aspect-square rounded" />
          </div>
          <div v-else-if="clientPhotos?.length" class="mt-4 grid grid-cols-3 gap-2">
            <div v-for="photo in clientPhotos" :key="photo.id" class="group relative aspect-square overflow-hidden rounded border border-stone-200 bg-stone-50">
              <img :src="photo.url" :alt="photo.filename" class="h-full w-full object-cover" />
              <button
                type="button"
                class="absolute right-1 top-1 rounded bg-white/90 px-2 py-1 text-xs text-stone-700 opacity-0 shadow transition group-hover:opacity-100"
                @click="deletePhoto(photo.id)"
              >
                Borrar
              </button>
            </div>
          </div>
          <div v-else class="mt-4 rounded-md border border-dashed border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
            Todavía no subiste fotos.
          </div>
        </div>

        <div class="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div class="text-sm font-semibold text-stone-900">Acciones rápidas</div>
          <div class="mt-3 space-y-2">
            <UButton to="/private/client/book" color="primary" block>Reservar turno</UButton>
            <UButton to="/private/client/appointments" variant="outline" block>Mis turnos</UButton>
            <UButton to="/private/client/redeem" variant="outline" block>Canjear puntos</UButton>
            <UButton to="/private/profile" variant="outline" block>Editar mi perfil</UButton>
          </div>
        </div>

        <div class="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div class="text-sm font-semibold text-stone-900">Estado de cuenta</div>
          <div v-if="isLoading" class="mt-3 space-y-2">
            <USkeleton class="h-4 w-32" />
            <USkeleton class="h-4 w-24" />
          </div>
          <div v-else class="mt-3 text-sm text-stone-600">
            <div>Última visita: {{ lastAppointment ? formatDateTime(lastAppointment.startTime) : 'Aún sin visitas' }}</div>
            <div class="mt-1">Puntos acumulados: {{ pointsSummary?.balance ?? 0 }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
