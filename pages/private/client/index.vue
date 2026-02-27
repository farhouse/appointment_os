<script setup lang="ts">
import { loadMe } from '~/composables/useMe'

type Appointment = {
  id: string
  status: string
  startTime: string
  endTime: string
  branch: { name: string }
  professional?: { name: string } | null
  services: { service: { name: string } }[]
}

type PointsSummary = {
  balance: number
}

definePageMeta({
  layout: 'private',
  middleware: ['private', 'role'],
  roles: ['CLIENT'],
})

const { data: me, pending: isLoadingMe } = await useAsyncData('client-dashboard-me', () => loadMe())
const { data: pointsSummary, pending: isLoadingPoints, error: pointsError } = await useAsyncData('client-dashboard-points', () => $fetch<PointsSummary>('/api/client/points'))
const { data: appointments, pending: isLoadingAppointments, error: appointmentsError } = await useAsyncData(
  'client-dashboard-appointments',
  () => $fetch<Appointment[]>('/api/client/appointments')
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

const isLoading = computed(() => isLoadingMe.value || isLoadingPoints.value || isLoadingAppointments.value)
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

        <div class="grid gap-4 md:grid-cols-2">
          <div class="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div class="text-sm font-semibold text-stone-900">Rebook rápido</div>
            <div class="mt-1 text-sm text-stone-600">Repetí tu último servicio en pocos pasos.</div>
            <div class="mt-4 space-y-2">
              <div class="rounded-md border border-dashed border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
                Última visita: {{ lastAppointment ? formatDateTime(lastAppointment.startTime) : 'Sin historial' }}
              </div>
              <UButton to="/private/client/book" color="primary" block>Reservar de nuevo</UButton>
            </div>
          </div>

          <div class="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div class="text-sm font-semibold text-stone-900">Novedades y promos</div>
            <div class="mt-1 text-sm text-stone-600">Muy pronto vas a ver beneficios personalizados.</div>
            <div class="mt-4 rounded-md border border-dashed border-stone-200 bg-stone-50 p-3 text-sm text-stone-500">
              En preparación: lanzamientos, combos y descuentos para clientes frecuentes.
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4">
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
