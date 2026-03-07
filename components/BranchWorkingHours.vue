<script setup lang="ts">
const props = defineProps<{
  branchId: string
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

async function loadWorkingHours() {
  if (!props.branchId) return
  isLoading.value = true
  try {
    const data = await $fetch(`/api/branches/working-hours?branchId=${props.branchId}`)
    const loaded = (data as any[]) || []
    workingHours.value = Array.from({ length: 7 }, (_, i) => {
      const existing = loaded.find((h: any) => h.dayOfWeek === i)
      return existing || { dayOfWeek: i, startTime: '09:00', endTime: '19:00', isWorking: i !== 0 }
    })
  } catch {
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

async function saveAll() {
  if (!workingHours.value.length) return

  for (const day of workingHours.value) {
    if (day.isWorking) {
      const [sh, sm] = day.startTime.split(':').map(Number)
      const [eh, em] = day.endTime.split(':').map(Number)
      if ((eh * 60 + em) <= (sh * 60 + sm)) {
        toast.add({ title: `Horario inválido en ${dayNames[day.dayOfWeek]}`, color: 'error' })
        return
      }
    }
  }

  isSaving.value = true
  try {
    for (const day of workingHours.value) {
      await $fetch(`/api/branches/working-hours?branchId=${props.branchId}${day.isWorking ? '' : `&dayOfWeek=${day.dayOfWeek}`}`, {
        method: day.isWorking ? 'PATCH' : 'DELETE',
        body: day.isWorking
          ? {
              dayOfWeek: day.dayOfWeek,
              startTime: day.startTime,
              endTime: day.endTime,
              isWorking: true
            }
          : undefined
      })
    }

    toast.add({ title: 'Horarios de sucursal guardados', color: 'success' })
    emit('saved')
  } catch (e: any) {
    toast.add({ title: e?.data?.statusMessage || 'Error guardando', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

watch(() => props.branchId, (id) => {
  if (id) loadWorkingHours()
}, { immediate: true })

defineExpose({
  saveAll,
  isSaving
})
</script>

<template>
  <div class="space-y-4">
    <div class="text-sm font-medium text-stone-700">Horarios de la sucursal</div>
    <div v-if="isLoading" class="text-sm text-stone-500">Cargando...</div>
    <div v-else class="space-y-2">
      <div
        v-for="day in workingHours"
        :key="day.dayOfWeek"
        class="flex items-center gap-3 rounded border border-stone-200 p-2"
      >
        <UCheckbox v-model="day.isWorking" :label="dayNames[day.dayOfWeek]" class="w-28" />
        <div v-if="day.isWorking" class="flex items-center gap-2 flex-1">
          <UInput v-model="day.startTime" type="time" class="w-28" />
          <span class="text-stone-500">a</span>
          <UInput v-model="day.endTime" type="time" class="w-28" />
        </div>
        <div v-else class="flex-1 text-xs text-stone-400">Sucursal cerrada</div>
      </div>

    </div>
  </div>
</template>
