import { type QueryKey, queryOptions } from '@tanstack/react-query'
import { getVaccinations, getAnimalTypes } from './requests'

export const vaccinationQueryKeys = {
  all: ['vaccinations'],
  list: ['vaccinations', 'list'],
  listByAnimalType: (animalTypeId: string) => [
    'vaccinations',
    'list',
    'byAnimalType',
    animalTypeId,
  ],
}

export const animalTypeQueryKeys: Record<string, QueryKey> = {
  all: ['animalTypes'],
  list: ['animalTypes', 'list'],
}

export const listVaccinationsQuery = queryOptions({
  queryFn: () => getVaccinations(),
  queryKey: vaccinationQueryKeys.list,
})

export const listVaccinationsByAnimalTypeQuery = (animalTypeId: string) =>
  queryOptions({
    queryFn: () => getVaccinations({ animal_type_id: animalTypeId }),
    queryKey: vaccinationQueryKeys.listByAnimalType(animalTypeId),
  })

export const listAnimalTypesQuery = queryOptions({
  queryFn: getAnimalTypes,
  queryKey: animalTypeQueryKeys.list,
})
