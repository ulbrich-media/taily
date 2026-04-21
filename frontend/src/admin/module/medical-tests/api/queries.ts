import { type QueryKey, queryOptions } from '@tanstack/react-query'
import { getMedicalTests, getAnimalTypes } from './requests'

export const medicalTestQueryKeys = {
  all: ['medicalTests'],
  list: ['medicalTests', 'list'],
  listByAnimalType: (animalTypeId: string) => [
    'medicalTests',
    'list',
    'byAnimalType',
    animalTypeId,
  ],
}

export const animalTypeQueryKeys: Record<string, QueryKey> = {
  all: ['animalTypes'],
  list: ['animalTypes', 'list'],
}

export const listMedicalTestsQuery = queryOptions({
  queryFn: () => getMedicalTests(),
  queryKey: medicalTestQueryKeys.list,
})

export const listMedicalTestsByAnimalTypeQuery = (animalTypeId: string) =>
  queryOptions({
    queryFn: () => getMedicalTests({ animal_type_id: animalTypeId }),
    queryKey: medicalTestQueryKeys.listByAnimalType(animalTypeId),
  })

export const listAnimalTypesQuery = queryOptions({
  queryFn: getAnimalTypes,
  queryKey: animalTypeQueryKeys.list,
})
