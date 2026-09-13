import { queryOptions } from '@tanstack/react-query'
import { getPublicContract } from './requests'

export const getPublicContractQuery = (token: string) =>
  queryOptions({
    queryKey: ['public-contract', token] as const,
    queryFn: () => getPublicContract(token),
    retry: false,
  })
