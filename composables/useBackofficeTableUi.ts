export function useBackofficeTableUi() {
  // Nuxt UI Table `ui` overrides to match the app's stone/amber palette.
  // Dark mode removed → keep a single light palette.
  return {
    root: 'relative overflow-auto bg-white',
    base: 'min-w-full bg-white',

    thead: 'relative bg-white/90 backdrop-blur',
    th: 'px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-600',

    tbody: [
      'isolate bg-white',
      'divide-y divide-stone-200',
      '[&>tr]:data-[selectable=true]:hover:bg-amber-50/60',
      '[&>tr]:data-[selectable=true]:focus-visible:outline-amber-500'
    ].join(' '),

    tr: 'bg-white data-[selected=true]:bg-amber-50/70',
    td: 'p-4 text-sm text-stone-800 whitespace-nowrap',
    empty: 'py-6 text-center text-sm text-stone-500'
  } as const
}
