import { queryOptions } from '@tanstack/react-query'
import { getPreInspections, getPreInspection } from './requests'

export const preInspectionQueryKeys = {
  all: ['pre-inspections'] as const,
  list: ['pre-inspections', 'list'] as const,
  listByPerson: (personId: string) =>
    ['pre-inspections', 'list', 'person', personId] as const,
  listByAdoption: (adoptionId: string) =>
    ['pre-inspections', 'list', 'adoption', adoptionId] as const,
  detail: (id: string) => ['pre-inspections', 'detail', id] as const,
}

// All pre-inspections of a person's adoptions — the cross-reference of what
// a repeat applicant already went through.
export const listPreInspectionsByPersonQuery = (personId: string) =>
  queryOptions({
    queryKey: preInspectionQueryKeys.listByPerson(personId),
    queryFn: () => getPreInspections({ person_id: personId }),
  })

export const listPreInspectionsByAdoptionQuery = (adoptionId: string) =>
  queryOptions({
    queryKey: preInspectionQueryKeys.listByAdoption(adoptionId),
    queryFn: () => getPreInspections({ adoption_id: adoptionId }),
  })

export const getPreInspectionQuery = (id: string) =>
  queryOptions({
    queryKey: preInspectionQueryKeys.detail(id),
    queryFn: () => getPreInspection(id),
  })
