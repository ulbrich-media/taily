import { type QueryKey, queryOptions } from '@tanstack/react-query'
import {
  getHealthConditions,
  getAnimalTypes,
} from '@/admin/module/health-conditions/api/requests.ts'

export const healthConditionQueryKeys = {
  all: ['healthConditions'],
  list: ['healthConditions', 'list'],
  listByAnimalType: (animalTypeId: string) => [
    'healthConditions',
    'list',
    'byAnimalType',
    animalTypeId,
  ],
}

export const animalTypeQueryKeys: Record<string, QueryKey> = {
  all: ['animalTypes'],
  list: ['animalTypes', 'list'],
}

export const listHealthConditionsQuery = queryOptions({
  queryFn: () => getHealthConditions(),
  queryKey: healthConditionQueryKeys.list,
})

export const listHealthConditionsByAnimalTypeQuery = (animalTypeId: string) =>
  queryOptions({
    queryFn: () =>
      getHealthConditions({
        animal_type_id: animalTypeId,
      }),
    queryKey: healthConditionQueryKeys.listByAnimalType(animalTypeId),
  })

export const listAnimalTypesQuery = queryOptions({
  queryFn: getAnimalTypes,
  queryKey: animalTypeQueryKeys.list,
})
