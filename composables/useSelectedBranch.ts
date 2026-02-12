type BranchOption = {
  id: string
  name: string
}

const STORAGE_KEY = 'selectedBranchId'

export function useSelectedBranch(defaultBranchId?: Ref<string | undefined>) {
  const selectedBranchId = useState<string>('selected-branch-id', () => defaultBranchId?.value || '')
  const branchOptions = useState<BranchOption[]>('branch-options', () => [])
  const isLoading = useState<boolean>('branch-options-loading', () => false)

  const cookie = useCookie<string>(STORAGE_KEY, { sameSite: 'lax' })
  const { data, pending, refresh, error } = useFetch<BranchOption[]>('/api/public/branches')

  watchEffect(() => {
    isLoading.value = pending.value
  })

  watchEffect(() => {
    if (data.value) {
      branchOptions.value = data.value
    }
  })

  watchEffect(() => {
    const fallbackBranchId = defaultBranchId?.value
    if (cookie.value && selectedBranchId.value !== cookie.value) {
      selectedBranchId.value = cookie.value
    } else if (!cookie.value && fallbackBranchId && selectedBranchId.value !== fallbackBranchId) {
      selectedBranchId.value = fallbackBranchId
    }
  })

  watch(selectedBranchId, (value) => {
    cookie.value = value || ''
  })

  return {
    selectedBranchId,
    branchOptions,
    isLoading,
    error,
    refresh
  }
}
