type SortDirection = 'asc' | 'desc'

type CrudTableOptions<T> = {
  search?: (item: T, query: string) => boolean
  sort?: (a: T, b: T, sortBy: string, direction: SortDirection) => number
  initialSortBy?: string
  initialSortDir?: SortDirection
  pageSize?: number
  debounceMs?: number
}

function getByPath<T>(item: T, path: string) {
  return path.split('.').reduce<any>((acc, key) => acc?.[key], item)
}

function defaultSort(a: unknown, b: unknown, direction: SortDirection) {
  if (a == null && b == null) return 0
  if (a == null) return direction === 'asc' ? 1 : -1
  if (b == null) return direction === 'asc' ? -1 : 1

  if (a instanceof Date && b instanceof Date) {
    return direction === 'asc' ? a.getTime() - b.getTime() : b.getTime() - a.getTime()
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return direction === 'asc' ? a - b : b - a
  }

  const aValue = String(a)
  const bValue = String(b)
  const compare = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' })
  return direction === 'asc' ? compare : -compare
}

export function useCrudTable<T>(items: Ref<T[]> | ComputedRef<T[]>, options: CrudTableOptions<T> = {}) {
  const search = ref('')
  const debouncedSearch = ref('')
  const page = ref(1)
  const pageSize = ref(options.pageSize ?? 10)
  const sortBy = ref(options.initialSortBy ?? '')
  const sortDir = ref<SortDirection>(options.initialSortDir ?? 'asc')

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  watch(search, (value) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedSearch.value = value.trim()
      page.value = 1
    }, options.debounceMs ?? 300)
  })

  onBeforeUnmount(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  const filtered = computed(() => {
    if (!debouncedSearch.value) return items.value
    if (!options.search) return items.value
    return items.value.filter((item) => options.search?.(item, debouncedSearch.value))
  })

  const sorted = computed(() => {
    if (!sortBy.value) return filtered.value
    const data = [...filtered.value]
    if (options.sort) {
      return data.sort((a, b) => options.sort?.(a, b, sortBy.value, sortDir.value) ?? 0)
    }

    return data.sort((a, b) => {
      const aValue = getByPath(a, sortBy.value)
      const bValue = getByPath(b, sortBy.value)
      return defaultSort(aValue, bValue, sortDir.value)
    })
  })

  const total = computed(() => sorted.value.length)
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

  watch([pageCount, pageSize], () => {
    if (page.value > pageCount.value) page.value = pageCount.value
    if (page.value < 1) page.value = 1
  })

  const paged = computed(() => {
    const start = (page.value - 1) * pageSize.value
    return sorted.value.slice(start, start + pageSize.value)
  })

  function toggleSort(key: string) {
    if (sortBy.value !== key) {
      sortBy.value = key
      sortDir.value = 'asc'
      return
    }
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  }

  function setSort(key: string, direction: SortDirection) {
    sortBy.value = key
    sortDir.value = direction
  }

  return {
    search,
    debouncedSearch,
    page,
    pageSize,
    sortBy,
    sortDir,
    filtered,
    sorted,
    paged,
    total,
    pageCount,
    toggleSort,
    setSort
  }
}
