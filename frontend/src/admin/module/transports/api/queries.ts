import { queryOptions } from '@tanstack/react-query'
import { getTransports } from './requests'

export const transportQueryKeys = {
  all: ['transports'] as const,
  list: () => ['transports', 'list'] as const,
}

export const listTransportsQuery = () =>
  queryOptions({
    queryKey: transportQueryKeys.list(),
    queryFn: () => getTransports(),
  })
