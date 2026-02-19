type BranchOption = {
  id: string
  name: string
}

const STORAGE_KEY = 'selectedBranchId'

export function useSelectedBranch(defaultBranchId?: Ref<string | undefined>) {
  const selectedBranchId = useState<string>('selected-branch-id', () => '')
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
    // Only initialize when empty.
    if (selectedBranchId.value) return

    const fallbackBranchId = defaultBranchId?.value

    if (cookie.value) {
      selectedBranchId.value = cookie.value
      return
    }

    if (fallbackBranchId) {
      selectedBranchId.value = fallbackBranchId
    }
  })

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
