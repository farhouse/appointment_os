export function useBackofficeTableUi() {
  // Nuxt UI Table `ui` overrides to match the app's stone/amber palette.
  // Keep it light: focus on header + row hover/selected + dividers.
  return {
    // Ensure table itself has the right surface color (otherwise it inherits the app's cream background).
    // In dark mode we want the table surface to match the header tone.
    root: 'relative overflow-auto bg-white dark:bg-[#2a1d15]',
    base: 'min-w-full bg-white dark:bg-[#2a1d15]',

    thead: 'relative bg-white/90 dark:bg-[#2a1d15] backdrop-blur',
    th: 'px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-amber-100/70',

    tbody: [
      'isolate bg-white dark:bg-[#2a1d15]',
      'divide-y divide-stone-200 dark:divide-[#3a2a1f]',
      // Slightly lighter on hover, selected stays the same tone family.
      '[&>tr]:data-[selectable=true]:hover:bg-amber-50/60 dark:[&>tr]:data-[selectable=true]:hover:bg-[#35251b]',
      '[&>tr]:data-[selectable=true]:focus-visible:outline-amber-500'
    ].join(' '),

    tr: 'bg-white dark:bg-[#2a1d15] data-[selected=true]:bg-amber-50/70 dark:data-[selected=true]:bg-[#35251b]',
    td: 'p-4 text-sm text-stone-800 dark:text-amber-100/85 whitespace-nowrap',
    empty: 'py-6 text-center text-sm text-stone-500 dark:text-amber-100/70'
  } as const
}
