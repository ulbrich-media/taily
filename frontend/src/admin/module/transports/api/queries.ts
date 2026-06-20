import { queryOptions } from '@tanstack/react-query'
import { getTransports } from './requests'
import type { ListTransportsParams } from './types'

export const transportQueryKeys = {
  all: ['transports'] as const,
  list: (params?: ListTransportsParams) =>
    ['transports', 'list', params ?? {}] as const,
}

export const listTransportsQuery = (params?: ListTransportsParams) =>
  queryOptions({
    queryKey: transportQueryKeys.list(params),
    queryFn: () => getTransports(params),
  })
