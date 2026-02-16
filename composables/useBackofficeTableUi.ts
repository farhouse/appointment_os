export function useBackofficeTableUi() {
  // Nuxt UI Table `ui` overrides to match the app's stone/amber palette.
  // Keep it light: focus on header + row hover/selected + dividers.
  return {
    thead: 'bg-white/80 dark:bg-[#1a120d]/80 backdrop-blur',
    th: 'px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-amber-100/70',
    tbody: [
      'divide-y divide-stone-200 dark:divide-[#3a2a1f]',
      '[&>tr]:data-[selectable=true]:hover:bg-amber-50/60 dark:[&>tr]:data-[selectable=true]:hover:bg-[#2a1d15]',
      '[&>tr]:data-[selectable=true]:focus-visible:outline-amber-500'
    ].join(' '),
    tr: 'data-[selected=true]:bg-amber-50/70 dark:data-[selected=true]:bg-[#2a1d15]',
    td: 'p-4 text-sm text-stone-700 dark:text-amber-100/90 whitespace-nowrap',
    empty: 'py-6 text-center text-sm text-stone-500 dark:text-amber-100/70'
  } as const
}
