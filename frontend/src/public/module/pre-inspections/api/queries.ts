import { queryOptions } from '@tanstack/react-query'
import { getPublicInspection } from './requests'

export const getPublicInspectionQuery = (token: string) =>
  queryOptions({
    queryKey: ['public-inspection', token] as const,
    queryFn: () => getPublicInspection(token),
    retry: false,
  })
