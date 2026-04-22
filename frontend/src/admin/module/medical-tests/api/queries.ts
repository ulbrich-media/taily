import { queryOptions } from '@tanstack/react-query'
import { getMedicalTests } from './requests'

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

export const listMedicalTestsQuery = queryOptions({
  queryFn: () => getMedicalTests(),
  queryKey: medicalTestQueryKeys.list,
})

export const listMedicalTestsByAnimalTypeQuery = (animalTypeId: string) =>
  queryOptions({
    queryFn: () => getMedicalTests({ animal_type_id: animalTypeId }),
    queryKey: medicalTestQueryKeys.listByAnimalType(animalTypeId),
  })
