<script setup lang="ts">
import { z } from 'zod'

const props = defineProps<{
  userId: string
}>()

const emit = defineEmits(['saved'])

const toast = useToast()

type WorkingHour = {
  dayOfWeek: number
  startTime: string
  endTime: string
  isWorking: boolean
}

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const workingHours = ref<WorkingHour[]>([])
const isLoading = ref(false)
const isSaving = ref(false)

const schema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm'),
  isWorking: z.boolean()
})

async function loadWorkingHours() {
  if (!props.userId) return
  isLoading.value = true
  try {
    const data = await $fetch(`/api/employees/working-hours?userId=${props.userId}`)
    const loaded = (data as any[]) || []
    workingHours.value = Array.from({ length: 7 }, (_, i) => {
      const existing = loaded.find((h: any) => h.dayOfWeek === i)
      return existing || { dayOfWeek: i, startTime: '09:00', endTime: '19:00', isWorking: true }
    })
  } catch (e) {
    workingHours.value = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      startTime: '09:00',
      endTime: '19:00',
      isWorking: i !== 0
    }))
  } finally {
    isLoading.value = false
  }
}

async function saveDay(dayIndex: number) {
  const day = workingHours.value[dayIndex]
  if (!day) return

  if (day.isWorking) {
    const startParts = day.startTime.split(':')
    const endParts = day.endTime.split(':')
    const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1])
    const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1])
    if (endMins <= startMins) {
      toast.add({ title: 'La hora de fin debe ser mayor a la de inicio', color: 'error' })
      return
    }
  }

  isSaving.value = true
  try {
    await $fetch(`/api/employees/working-hours?userId=${props.userId}`, {
      method: day.isWorking ? 'PATCH' : 'DELETE',
      body: day.isWorking ? {
        dayOfWeek: day.dayOfWeek,
        startTime: day.startTime,
        endTime: day.endTime,
        isWorking: day.isWorking
      } : undefined
    })
    toast.add({ title: 'Horario guardado', color: 'success' })
    emit('saved')
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || 'Error guardando', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

watch(() => props.userId, (id) => {
  if (id) loadWorkingHours()
}, { immediate: true })
</script>

<template>
  <div class="space-y-4">
    <div class="text-sm font-medium text-stone-700">Horarios laborales</div>
    <div v-if="isLoading" class="text-sm text-stone-500">Cargando...</div>
    <div v-else class="space-y-2">
      <div
        v-for="(day, index) in workingHours"
        :key="day.dayOfWeek"
        class="flex items-center gap-3 rounded border border-stone-200 p-2"
      >
        <UCheckbox v-model="day.isWorking" :label="dayNames[day.dayOfWeek]" class="w-28" />
        <div v-if="day.isWorking" class="flex items-center gap-2 flex-1">
          <UInput v-model="day.startTime" type="time" class="w-28" />
          <span class="text-stone-500">a</span>
          <UInput v-model="day.endTime" type="time" class="w-28" />
          <UButton size="xs" :loading="isSaving" @click="saveDay(index)">Guardar</UButton>
        </div>
        <div v-else class="flex-1 text-xs text-stone-400">Día no laborable</div>
      </div>
    </div>
  </div>
</template>
