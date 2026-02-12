<script setup lang="ts">
import '@fullcalendar/core/vdom'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { CalendarOptions } from '@fullcalendar/core'

const props = defineProps<{ options: CalendarOptions }>()

const basePlugins = [dayGridPlugin, timeGridPlugin, interactionPlugin]

const mergedOptions = computed<CalendarOptions>(() => {
  const incoming = props.options || {}
  const incomingPlugins = Array.isArray(incoming.plugins) ? incoming.plugins : []
  return { ...incoming, plugins: [...basePlugins, ...incomingPlugins] }
})
</script>

<template>
  <FullCalendar :options="mergedOptions" v-bind="$attrs" />
</template>
