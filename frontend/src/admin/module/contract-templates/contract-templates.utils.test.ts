import { describe, expect, it } from 'vitest'
import type { ContractFieldOptions } from '@/api/types/contract-templates'
import {
  adopterOptions,
  fieldLabel,
  fieldSummary,
  toFormData,
} from './contract-templates.utils'

const options: ContractFieldOptions = {
  animal: [{ key: 'animal.name', label: 'Name des Tieres' }],
  mediator: [{ key: 'mediator.full_name', label: 'Vermittler:in' }],
  adopter: [
    {
      animal_type_id: 'dog',
      fields: [
        { key: 'first_name', label: 'Vorname' },
        { key: 'id_card_number', label: 'Ausweisnummer' },
      ],
    },
    {
      animal_type_id: 'cat',
      fields: [{ key: 'first_name', label: 'Vorname' }],
    },
  ],
}

describe('adopterOptions', () => {
  it('offers the fields every chosen animal type has', () => {
    expect(adopterOptions(options, ['dog']).map((o) => o.key)).toEqual([
      'first_name',
      'id_card_number',
    ])
    expect(adopterOptions(options, ['dog', 'cat']).map((o) => o.key)).toEqual([
      'first_name',
    ])
  })

  it('offers nothing without an animal type', () => {
    expect(adopterOptions(options, [])).toEqual([])
  })
})

describe('fieldLabel', () => {
  it('finds adopter labels of any animal type', () => {
    expect(fieldLabel(options, 'adopter', 'id_card_number')).toBe(
      'Ausweisnummer'
    )
    expect(fieldLabel(options, 'animal', 'animal.name')).toBe('Name des Tieres')
    expect(fieldLabel(options, 'animal', 'unknown')).toBeUndefined()
  })
})

describe('fieldSummary', () => {
  it('counts fields and required ones', () => {
    expect(fieldSummary([])).toBe('0 Felder')
    expect(fieldSummary([{ key: 'a', required: false }])).toBe('1 Feld')
    expect(
      fieldSummary([
        { key: 'a', required: true },
        { key: 'b', required: false },
      ])
    ).toBe('2 Felder, 1 Pflicht')
  })
})

describe('toFormData', () => {
  it('starts a new template empty, titled Schutzvertrag', () => {
    expect(toFormData()).toEqual({
      name: '',
      title: 'Schutzvertrag',
      body: '',
      animal_type_ids: [],
      animal_fields: [],
      mediator_fields: [],
      adopter_fields: [],
    })
  })
})
