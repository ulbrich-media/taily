import { queryOptions } from '@tanstack/react-query'
import { getCaseFile, getTransportChecklist } from './requests'

export const caseFileQueryKeys = {
  all: ['case-file'] as const,
  detail: (adoptionId: string) => ['case-file', adoptionId] as const,
  transport: (transportId: string) =>
    ['case-file', 'transport', transportId] as const,
}

export const getCaseFileQuery = (adoptionId: string) =>
  queryOptions({
    queryKey: caseFileQueryKeys.detail(adoptionId),
    queryFn: () => getCaseFile(adoptionId),
  })

export const getTransportChecklistQuery = (transportId: string) =>
  queryOptions({
    queryKey: caseFileQueryKeys.transport(transportId),
    queryFn: () => getTransportChecklist(transportId),
  })
