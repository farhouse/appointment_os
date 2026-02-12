// Ensure FullCalendar v5 VDOM is initialized on the client before any plugins/views are imported.
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(() => {
  // Side-effect import initializes global FullCalendarVDom.
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  import('@fullcalendar/core/vdom')
})
