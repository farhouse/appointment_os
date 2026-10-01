<script setup lang="ts">
import { loadMe } from '~/composables/useMe'
import { useSelectedBranch } from '~/composables/useSelectedBranch'

definePageMeta({ layout: 'private', middleware: ['private', 'role'], roles: ['OWNER', 'ADMIN', 'MANAGER'] })
await loadMe()

type Summary = { appointmentsToday: number, revenueToday: number, openCashSessions: number, clientsServedToday: number }
type Employee = { id: string, name: string, role: string, active: boolean, branches: Array<{ branchId: string }> }
type Event = {
  id: string, title: string, start: string, end: string, schedule?: string
  extendedProps?: {
    type?: 'APPOINTMENT' | 'BLOCK', status?: string, reason?: string
    professional?: { id: string, name: string } | null
    services?: Array<{ name: string }>
    client?: { firstName: string, lastName?: string | null }
  }
}

const { locale } = useI18n()
const { selectedBranchId } = useSelectedBranch()
const date = ref(new Date())
const summary = ref<Summary>()
const employees = ref<Employee[]>([])
const events = ref<Event[]>([])
const loading = ref(false)
const error = ref('')
const localeCode = computed(() => locale.value === 'es-AR' ? 'es-AR' : 'en-US')
const isToday = computed(() => date.value.toDateString() === new Date().toDateString())
const title = computed(() => (isToday.value ? 'Hoy, ' : '') + new Intl.DateTimeFormat(localeCode.value, { weekday: 'long', day: 'numeric' }).format(date.value))
const fullDate = computed(() => new Intl.DateTimeFormat(localeCode.value, { day: 'numeric', month: 'long', year: 'numeric' }).format(date.value))
const money = computed(() => new Intl.NumberFormat(localeCode.value, { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }))
const professionals = computed(() => employees.value.filter(employee =>
  employee.active && employee.role === 'BARBER' &&
  (!selectedBranchId.value || employee.branches.some(branch => branch.branchId === selectedBranchId.value))
))
const appointments = computed(() => events.value.filter(event => event.extendedProps?.type !== 'BLOCK'))
const pending = computed(() => appointments.value.filter(event => event.extendedProps?.status === 'PENDING').length)
const hours = Array.from({ length: 11 }, (_, index) => index + 9)
const calendarHeight = 600

const metrics = computed(() => [
  { label: 'turnos hoy', value: summary.value?.appointmentsToday ?? '—', icon: 'i-heroicons-calendar-days' },
  { label: 'facturación hoy', value: summary.value ? money.value.format(summary.value.revenueToday) : '—', icon: 'i-heroicons-banknotes' },
  { label: 'cajas abiertas ahora', value: summary.value?.openCashSessions ?? '—', icon: 'i-heroicons-archive-box' },
  { label: 'clientes atendidos hoy', value: summary.value?.clientsServedToday ?? '—', icon: 'i-heroicons-user-group' },
])
const alerts = computed(() => [
  ...(summary.value?.openCashSessions === 0 ? [{ title: 'No hay cajas abiertas', detail: 'Abrí una caja antes de registrar cobros.', to: '/private/backoffice/cash' }] : []),
  ...(pending.value ? [{ title: pending.value + ' turnos por confirmar', detail: 'Revisá la agenda y confirmá asistencia.', to: '/private/backoffice/calendar' }] : []),
  ...(!appointments.value.length && !loading.value ? [{ title: 'Sin turnos para este día', detail: 'La agenda no tiene reservas registradas.', to: '/private/backoffice/calendar' }] : []),
])
const actions = [
  { label: 'Gestionar turnos', detail: 'Confirmar, mover o crear reservas', icon: 'i-heroicons-calendar-days', to: '/private/backoffice/calendar' },
  { label: 'Revisar caja', detail: 'Sesiones y movimientos del día', icon: 'i-heroicons-banknotes', to: '/private/backoffice/cash' },
  { label: 'Registrar una venta', detail: 'Servicios, productos y medios de pago', icon: 'i-heroicons-shopping-cart', to: '/private/backoffice/sales' },
  { label: 'Controlar stock', detail: 'Existencias y movimientos', icon: 'i-heroicons-cube', to: '/private/backoffice/products?tab=stock' },
]

async function load() {
  loading.value = true
  error.value = ''
  const start = new Date(date.value)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  const eventsQuery = new URLSearchParams({ start: start.toISOString(), end: end.toISOString() })
  const summaryQuery = new URLSearchParams()
  if (selectedBranchId.value) {
    eventsQuery.set('branchId', selectedBranchId.value)
    summaryQuery.set('branchId', selectedBranchId.value)
  }
  try {
    const result = await Promise.all([
      $fetch<Summary>('/api/dashboard/summary?' + summaryQuery),
      employees.value.length ? Promise.resolve(employees.value) : $fetch<Employee[]>('/api/employees'),
      $fetch<Event[]>('/api/calendar/events?' + eventsQuery),
    ])
    summary.value = result[0]
    employees.value = result[1]
    events.value = result[2]
  } catch (cause: any) {
    error.value = cause?.data?.statusMessage || 'No pudimos cargar el panel.'
  } finally {
    loading.value = false
  }
}

function moveDay(offset: number) {
  const next = new Date(date.value)
  next.setDate(next.getDate() + offset)
  date.value = next
}
function goToday() { date.value = new Date() }
function initials(name: string) { return name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() }
function professionalEvents(id: string) { return events.value.filter(event => event.schedule === id || event.extendedProps?.professional?.id === id) }
function minutes(value: string) { const parsed = new Date(value); return parsed.getHours() * 60 + parsed.getMinutes() }
function eventStyle(event: Event) {
  const start = Math.max(540, minutes(event.start))
  const end = Math.min(1140, minutes(event.end))
  return { top: (start - 540) + 'px', height: Math.max(32, end - start - 4) + 'px' }
}
function eventClass(event: Event) { return event.extendedProps?.type === 'BLOCK' ? 'event-block' : 'event-' + (event.extendedProps?.status || 'PENDING').toLowerCase() }
function client(event: Event) {
  if (event.extendedProps?.type === 'BLOCK') return event.extendedProps.reason || 'Bloqueado'
  const value = event.extendedProps?.client
  return value ? (value.firstName + ' ' + (value.lastName || '')).trim() : event.title.split(' - ')[0]
}
function service(event: Event) { return event.extendedProps?.type === 'BLOCK' ? 'Tiempo no disponible' : event.extendedProps?.services?.map(item => item.name).join(', ') || event.title.split(' - ').slice(1).join(' - ') }
function time(value: string | Date) { return new Intl.DateTimeFormat(localeCode.value, { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)) }
const currentTimeTop = computed(() => {
  if (!isToday.value) return null
  const now = new Date()
  const value = now.getHours() * 60 + now.getMinutes()
  return value >= 540 && value <= 1140 ? value - 540 : null
})

watch([selectedBranchId, date], () => { void load() }, { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-[1600px]">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase text-[#627087]">Mesa de operaciones</p>
        <h1 class="mt-1 font-serif text-3xl font-semibold capitalize leading-tight sm:text-4xl">{{ title }}</h1>
        <p class="mt-1 text-sm text-[#627087]">Turnos, ventas y equipo en una sola vista.</p>
      </div>
      <div class="flex items-center rounded-md border border-[#d9e1ea] bg-white p-1">
        <UButton icon="i-heroicons-chevron-left" color="neutral" variant="ghost" aria-label="Día anterior" @click="moveDay(-1)" />
        <button type="button" class="min-w-36 px-3 text-sm font-semibold capitalize" @click="goToday">{{ fullDate }}</button>
        <UButton icon="i-heroicons-chevron-right" color="neutral" variant="ghost" aria-label="Día siguiente" @click="moveDay(1)" />
      </div>
    </header>

    <div v-if="error" class="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{{ error }}</div>

    <section class="mt-6 grid grid-cols-2 border-y border-[#d9e1ea] bg-white lg:grid-cols-4" aria-label="Resumen del día">
      <div v-for="(metric, index) in metrics" :key="metric.label" class="flex min-w-0 items-center gap-3 px-4 py-4 lg:border-r lg:border-[#edf1f6] lg:last:border-r-0">
        <span class="grid size-10 shrink-0 place-items-center rounded-md bg-blue-50 text-[#2563eb]"><UIcon :name="metric.icon" class="size-5" /></span>
        <div class="min-w-0"><div class="truncate text-2xl font-bold tabular-nums">{{ loading ? '…' : metric.value }}</div><div class="truncate text-xs text-[#627087]">{{ metric.label }}</div></div>
      </div>
    </section>

    <div class="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section class="min-w-0 overflow-hidden rounded-lg border border-[#d9e1ea] bg-white" aria-labelledby="agenda-title">
        <div class="flex items-center justify-between gap-3 border-b border-[#d9e1ea] px-4 py-3">
          <div class="flex items-center gap-4"><h2 id="agenda-title" class="font-serif text-lg font-semibold">Agenda del día</h2><span class="text-xs text-[#627087]">{{ professionals.length }} profesionales</span></div>
          <UButton to="/private/backoffice/calendar" label="Abrir agenda" color="neutral" variant="ghost" trailing-icon="i-heroicons-arrow-right" />
        </div>
        <div v-if="!selectedBranchId" class="grid min-h-80 place-items-center p-8 text-center"><div><UIcon name="i-heroicons-map-pin" class="mx-auto size-8 text-[#8b98aa]" /><p class="mt-3 font-semibold">Seleccioná una sucursal</p><p class="mt-1 text-sm text-[#627087]">La agenda necesita una sucursal para ordenar profesionales y turnos.</p></div></div>
        <div v-else-if="!professionals.length && !loading" class="grid min-h-80 place-items-center p-8 text-center"><div><UIcon name="i-heroicons-users" class="mx-auto size-8 text-[#8b98aa]" /><p class="mt-3 font-semibold">No hay profesionales asignados</p></div></div>
        <div v-else class="overflow-x-auto">
          <div class="min-w-[760px]" :style="{ width: Math.max(760, 64 + professionals.length * 190) + 'px' }">
            <div class="grid border-b border-[#d9e1ea]" :style="{ gridTemplateColumns: '64px repeat(' + Math.max(1, professionals.length) + ', minmax(190px, 1fr))' }">
              <div class="border-r border-[#edf1f6]" />
              <div v-for="professional in professionals" :key="professional.id" class="flex items-center gap-2 border-r border-[#edf1f6] px-3 py-3 last:border-r-0">
                <span class="grid size-8 place-items-center rounded-full bg-[#edf1f6] text-xs font-bold">{{ initials(professional.name) }}</span>
                <div class="min-w-0"><div class="truncate text-sm font-semibold">{{ professional.name }}</div><div class="text-xs text-[#627087]">Profesional</div></div>
              </div>
            </div>
            <div class="relative grid" :style="{ gridTemplateColumns: '64px repeat(' + Math.max(1, professionals.length) + ', minmax(190px, 1fr))', height: calendarHeight + 'px' }">
              <div class="relative border-r border-[#d9e1ea]"><span v-for="hour in hours" :key="hour" class="absolute right-3 -translate-y-1/2 text-xs tabular-nums text-[#627087]" :style="{ top: (hour - 9) * 60 + 'px' }">{{ String(hour).padStart(2, '0') }}:00</span></div>
              <div v-for="professional in professionals" :key="professional.id" class="calendar-column relative border-r border-[#edf1f6] last:border-r-0">
                <NuxtLink v-for="event in professionalEvents(professional.id)" :key="event.id" to="/private/backoffice/calendar" class="calendar-event absolute inset-x-2 z-10 overflow-hidden rounded-md border px-2 py-1 text-xs hover:brightness-95 focus:ring-2 focus:ring-[#60a5fa]" :class="eventClass(event)" :style="eventStyle(event)">
                  <div class="font-semibold tabular-nums">{{ time(event.start) }}</div><div class="truncate font-semibold">{{ client(event) }}</div><div class="truncate opacity-75">{{ service(event) }}</div>
                </NuxtLink>
              </div>
              <div v-if="currentTimeTop !== null" class="pointer-events-none absolute left-0 right-0 z-20 border-t-2 border-[#2563eb]" :style="{ top: currentTimeTop + 'px' }"><span class="absolute -top-2.5 left-1 rounded bg-[#2563eb] px-1.5 py-0.5 text-xs font-bold text-white">{{ time(new Date()) }}</span></div>
            </div>
          </div>
        </div>
      </section>

      <aside class="space-y-4">
        <section class="rounded-lg border border-[#d9e1ea] bg-white">
          <div class="flex items-center justify-between border-b border-[#edf1f6] px-4 py-3"><h2 class="font-serif text-lg font-semibold">Alertas operativas</h2><span class="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-[#d45a55]">{{ alerts.length }}</span></div>
          <div v-if="alerts.length" class="divide-y divide-[#edf1f6]"><NuxtLink v-for="alert in alerts" :key="alert.title" :to="alert.to" class="flex gap-3 px-4 py-3 hover:bg-[#f6f8fb]"><UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 size-5 shrink-0 text-[#b66a16]" /><span><span class="block text-sm font-semibold">{{ alert.title }}</span><span class="block text-xs text-[#627087]">{{ alert.detail }}</span></span></NuxtLink></div>
          <p v-else class="px-4 py-5 text-sm text-[#627087]">No hay alertas operativas para este día.</p>
        </section>
        <section class="rounded-lg border border-[#d9e1ea] bg-white">
          <div class="border-b border-[#edf1f6] px-4 py-3"><h2 class="font-serif text-lg font-semibold">Próximas acciones</h2></div>
          <div class="divide-y divide-[#edf1f6]"><NuxtLink v-for="action in actions" :key="action.to" :to="action.to" class="flex items-center gap-3 px-4 py-3 hover:bg-[#f6f8fb]"><UIcon :name="action.icon" class="size-5 text-[#2563eb]" /><span class="min-w-0 flex-1"><span class="block text-sm font-semibold">{{ action.label }}</span><span class="block truncate text-xs text-[#627087]">{{ action.detail }}</span></span><UIcon name="i-heroicons-chevron-right" class="size-4 text-[#8b98aa]" /></NuxtLink></div>
        </section>
        <div class="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-4"><div class="font-serif text-lg font-semibold">La jornada, en claro</div><p class="mt-1 text-sm text-[#4b586d]">{{ appointments.length }} turnos visibles para organizar el día.</p></div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.calendar-column { background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 59px, #edf1f6 59px, #edf1f6 60px); }
.event-pending, .event-confirmed { border-color: #8b98aa; background: #edf1f6; color: #344158; }
.event-in_progress { border-color: #b66a16; background: #fff3df; color: #74420c; }
.event-finished, .event-paid { border-color: #2d7d68; background: #e3f3ec; color: #215d4e; }
.event-canceled, .event-no_show { border-color: #d45a55; background: #fdeceb; color: #8f3733; }
.event-block { border-color: #8b98aa; background: #e4e8ed; color: #4b586d; }
</style>
