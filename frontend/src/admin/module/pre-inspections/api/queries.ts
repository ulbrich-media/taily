import { queryOptions } from '@tanstack/react-query'
import { getPreInspections, getPreInspection } from './requests'

export const preInspectionQueryKeys = {
  all: ['pre-inspections'] as const,
  list: ['pre-inspections', 'list'] as const,
  listByPerson: (personId: string) =>
    ['pre-inspections', 'list', 'person', personId] as const,
  listByPersonAndAnimalType: (personId: string, animalTypeId: string) =>
    [
      'pre-inspections',
      'list',
      'person',
      personId,
      'animal-type',
      animalTypeId,
    ] as const,
  detail: (id: string) => ['pre-inspections', 'detail', id] as const,
}

export const listPreInspectionsQuery = queryOptions({
  queryKey: preInspectionQueryKeys.list,
  queryFn: () => getPreInspections(),
})

export const listPreInspectionsByPersonQuery = (personId: string) =>
  queryOptions({
    queryKey: preInspectionQueryKeys.listByPerson(personId),
    queryFn: () => getPreInspections({ person_id: personId }),
  })

export const listPreInspectionsByPersonAndAnimalTypeQuery = (
  personId: string,
  animalTypeId: string
) =>
  queryOptions({
    queryKey: preInspectionQueryKeys.listByPersonAndAnimalType(
      personId,
      animalTypeId
    ),
    queryFn: () =>
      getPreInspections({ person_id: personId, animal_type_id: animalTypeId }),
  })

export const getPreInspectionQuery = (id: string) =>
  queryOptions({
    queryKey: preInspectionQueryKeys.detail(id),
    queryFn: () => getPreInspection(id),
  })
