declare module 'vue-cal' {
  import type { DefineComponent } from 'vue'

  export type VueCalEvent = Record<string, any>

  export type VueCalView = {
    id: string
    title: string
    start: Date
    end: Date
    previous: () => void
    next: () => void
    goToToday: () => void
  }

  const VueCal: DefineComponent<Record<string, any>, Record<string, any>, any>
  export { VueCal }
  export default VueCal
}
