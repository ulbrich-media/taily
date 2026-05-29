import { queryOptions } from '@tanstack/react-query'
import { getTransports, getTransport } from './requests'

export const transportQueryKeys = {
  all: ['transports'] as const,
  list: () => ['transports', 'list'] as const,
  detail: (id: string) => ['transports', 'detail', id] as const,
}

export const listTransportsQuery = () =>
  queryOptions({
    queryKey: transportQueryKeys.list(),
    queryFn: () => getTransports(),
  })

export const getTransportQuery = (id: string) =>
  queryOptions({
    queryKey: transportQueryKeys.detail(id),
    queryFn: () => getTransport(id),
  })
