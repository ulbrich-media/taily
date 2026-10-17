import { queryOptions } from '@tanstack/react-query'
import { getVaccinations, getVaccinationsPage } from './requests'
import type { AnimalTypeItemListParams } from '@/admin/module/animal-types/animal-type-item-list.search'

export const vaccinationQueryKeys = {
  all: ['vaccinations'],
  // Prefix of every list query, so invalidating it covers all pages.
  list: ['vaccinations', 'list'],
  page: (params: AnimalTypeItemListParams) => [
    'vaccinations',
    'list',
    'page',
    params,
  ],
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

export const listVaccinationsPageQuery = (params: AnimalTypeItemListParams) =>
  queryOptions({
    queryFn: () => getVaccinationsPage(params),
    queryKey: vaccinationQueryKeys.page(params),
  })

export const listVaccinationsByAnimalTypeQuery = (animalTypeId: string) =>
  queryOptions({
    queryFn: () => getVaccinations({ animal_type_id: animalTypeId }),
    queryKey: vaccinationQueryKeys.listByAnimalType(animalTypeId),
  })
