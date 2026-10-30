import { describe, expect, it } from 'vitest'
import {
  animalTypeItemListSearchDefaults,
  animalTypeItemListSearchSchema,
  buildAnimalTypeItemListQuery,
  hasActiveAnimalTypeItemFilters,
  toAnimalTypeItemListParams,
} from './animal-type-item-list.search'

const ID = '0197c1f0-1a2b-7c3d-8e4f-0123456789ab'

describe('animalTypeItemListSearchSchema', () => {
  it('ignores sort and search, the list has a fixed order', () => {
    expect(
      animalTypeItemListSearchSchema.parse({ sort: '-title', search: 'x' })
    ).toEqual(animalTypeItemListSearchDefaults)
  })

  it('drops an invalid animal type', () => {
    expect(
      animalTypeItemListSearchSchema.parse({ animal_type_id: 'nope' })
        .animal_type_id
    ).toBeUndefined()
  })
})

describe('buildAnimalTypeItemListQuery', () => {
  it('sends the page and the animal type, but no sort', () => {
    const query = buildAnimalTypeItemListQuery(
      toAnimalTypeItemListParams({
        ...animalTypeItemListSearchDefaults,
        page: 2,
        animal_type_id: ID,
      })
    )
    expect(query).toBe(`page=2&per_page=25&filter%5Banimal_type_id%5D=${ID}`)
  })

  it('only counts the animal type as filter', () => {
    expect(
      hasActiveAnimalTypeItemFilters(animalTypeItemListSearchDefaults)
    ).toBe(false)
    expect(
      hasActiveAnimalTypeItemFilters({
        ...animalTypeItemListSearchDefaults,
        animal_type_id: ID,
      })
    ).toBe(true)
  })
})
