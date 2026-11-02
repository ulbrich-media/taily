import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { caseFileQueryKeys } from '@/admin/module/case-file/api/queries'
import { catalogueQueryKeys } from './api/queries'
import type { CatalogueResponse } from './api/requests'

/**
 * Every catalogue change answers with the whole catalogue; it replaces the
 * cached one, and adoptions' Case Files are refetched since requirements
 * apply live to running adoptions.
 */
export function useCatalogueMutation<TVariables>(
  animalTypeId: string,
  mutationFn: (variables: TVariables) => Promise<CatalogueResponse>,
  onDone?: () => void
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (response) => {
      queryClient.setQueryData(
        catalogueQueryKeys.detail(animalTypeId),
        response.data
      )
      queryClient.invalidateQueries({ queryKey: caseFileQueryKeys.all })
      toast.success(response.message)
      onDone?.()
    },
    onError: (error) => toast.error(error.message),
  })
}
