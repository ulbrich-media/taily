import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { caseFileQueryKeys } from '@/admin/module/case-file/api/queries'
import { contractTemplateQueryKeys } from './api/queries'
import type { ContractTemplateResponse } from './api/requests'

/**
 * A template change can change what every adoption of its animal types
 * needs for the contract, and which templates they are offered — so the
 * Case Files and the adoptions' template lists are refetched too.
 */
export function useContractTemplateMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<ContractTemplateResponse>,
  onDone?: () => void
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (response) => {
      queryClient.setQueryData(
        contractTemplateQueryKeys.detail(response.data.id),
        response.data
      )
      queryClient.invalidateQueries({ queryKey: contractTemplateQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: caseFileQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: ['adoptions', 'detail'] })
      toast.success(response.message)
      onDone?.()
    },
    onError: (error) => toast.error(error.message),
  })
}
