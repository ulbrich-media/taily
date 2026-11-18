import { describe, expect, it } from 'vitest'
import {
  fromSpeciesFormValue,
  NOT_EXPORTED,
  TIERVERMITTLUNG_SPECIES_OPTIONS,
  toSpeciesFormValue,
} from './tiervermittlung-species'

describe('tiervermittlung species form values', () => {
  it('turns a missing mapping into the "not exported" option and back', () => {
    expect(toSpeciesFormValue(null)).toBe(NOT_EXPORTED)
    expect(toSpeciesFormValue(undefined)).toBe(NOT_EXPORTED)
    expect(fromSpeciesFormValue(NOT_EXPORTED)).toBeNull()
  })

  it('keeps a mapped species as it is', () => {
    expect(toSpeciesFormValue('small')).toBe('small')
    expect(fromSpeciesFormValue('small')).toBe('small')
  })

  it('offers "not exported" first, then every species', () => {
    expect(TIERVERMITTLUNG_SPECIES_OPTIONS[0]).toEqual({
      value: NOT_EXPORTED,
      label: 'Nicht exportieren',
    })
    expect(TIERVERMITTLUNG_SPECIES_OPTIONS.map((o) => o.value)).toEqual([
      NOT_EXPORTED,
      'dog',
      'cat',
      'small',
      'bird',
      'reptile',
      'horse',
      'fish',
      'other',
    ])
  })
})
