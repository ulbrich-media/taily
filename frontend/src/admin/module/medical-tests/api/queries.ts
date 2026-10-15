import { queryOptions } from '@tanstack/react-query'
import { getMedicalTests, getMedicalTestsPage } from './requests'
import type { AnimalTypeItemListParams } from '@/admin/module/animal-types/animal-type-item-list.search'

export const medicalTestQueryKeys = {
  all: ['medicalTests'],
  // Prefix of every list query, so invalidating it covers all pages.
  list: ['medicalTests', 'list'],
  page: (params: AnimalTypeItemListParams) => [
    'medicalTests',
    'list',
    'page',
    params,
  ],
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

export const listMedicalTestsPageQuery = (params: AnimalTypeItemListParams) =>
  queryOptions({
    queryFn: () => getMedicalTestsPage(params),
    queryKey: medicalTestQueryKeys.page(params),
  })

export const listMedicalTestsByAnimalTypeQuery = (animalTypeId: string) =>
  queryOptions({
    queryFn: () => getMedicalTests({ animal_type_id: animalTypeId }),
    queryKey: medicalTestQueryKeys.listByAnimalType(animalTypeId),
  })
