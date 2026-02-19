type BranchOption = {
  id: string
  name: string
}

const STORAGE_KEY = 'selectedBranchId'

export function useSelectedBranch(defaultBranchId?: Ref<string | undefined>) {
  const selectedBranchId = useState<string>('selected-branch-id', () => '')
  const didInit = useState<boolean>('selected-branch-did-init', () => false)
  const branchOptions = useState<BranchOption[]>('branch-options', () => [])
  const isLoading = useState<boolean>('branch-options-loading', () => false)
  const isSwitching = useState<boolean>('selected-branch-switching', () => false)

  const cookie = useCookie<string>(STORAGE_KEY, { sameSite: 'lax' })
  const { data, pending, refresh, error } = useFetch<BranchOption[]>('/api/public/branches')

  // IMPORTANT:
  // This composable is used in multiple places (layout + pages).
  // Avoid continuously overwriting a user-picked branch from cookie/default.
  // We only initialize from cookie/default when there's no current selection.

  watchEffect(() => {
    isLoading.value = pending.value
  })

  watchEffect(() => {
    if (data.value) {
      branchOptions.value = data.value
    }
  })

  watchEffect(() => {
    if (didInit.value) return

    // Init once: prefer cookie, otherwise defaultBranchId.
    const fallbackBranchId = defaultBranchId?.value

    if (!selectedBranchId.value) {
      if (cookie.value) {
        selectedBranchId.value = cookie.value
      } else if (fallbackBranchId) {
        selectedBranchId.value = fallbackBranchId
      }
    }

    didInit.value = true
  })

  // If defaultBranchId arrives later (after me loads), apply it once only if still empty and cookie isn't set.
  watch(defaultBranchId || ref(undefined), (id) => {
    if (cookie.value) return
    if (selectedBranchId.value) return
    if (!id) return
    selectedBranchId.value = id
  }, { immediate: true })

  watch(selectedBranchId, (value) => {
    cookie.value = value || ''

    // UX: show a brief "applying" state when the user changes branch.
    // Pages that depend on the selected branch usually refetch immediately.
    isSwitching.value = true
    setTimeout(() => {
      isSwitching.value = false
    }, 600)
  })

  return {
    selectedBranchId,
    branchOptions,
    isLoading,
    isSwitching,
    error,
    refresh
  }
}
