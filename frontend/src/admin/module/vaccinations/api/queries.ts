import { queryOptions } from '@tanstack/react-query'
import { getVaccinations } from './requests'

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

export const listVaccinationsQuery = queryOptions({
  queryFn: () => getVaccinations(),
  queryKey: vaccinationQueryKeys.list,
})

export const listVaccinationsByAnimalTypeQuery = (animalTypeId: string) =>
  queryOptions({
    queryFn: () => getVaccinations({ animal_type_id: animalTypeId }),
    queryKey: vaccinationQueryKeys.listByAnimalType(animalTypeId),
  })
