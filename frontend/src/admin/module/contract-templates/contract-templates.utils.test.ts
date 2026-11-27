import { describe, expect, it } from 'vitest'
import type { ContractFieldOptions } from '@/api/types/contract-templates'
import {
  adopterOptions,
  fieldLabel,
  fieldSummary,
  toFormData,
} from './contract-templates.utils'

const options: ContractFieldOptions = {
  animal: [{ key: 'animal.breed', label: 'Rasse des Tieres' }],
  mediator: [{ key: 'mediator.email', label: 'E-Mail der Vermittler:in' }],
  adopter: [
    {
      animal_type_id: 'dog',
      fields: [
        { key: 'date_of_birth', label: 'Geburtsdatum' },
        { key: 'id_card_number', label: 'Ausweisnummer' },
      ],
    },
    {
      animal_type_id: 'cat',
      fields: [{ key: 'date_of_birth', label: 'Geburtsdatum' }],
    },
  ],
  fixed: {
    animal: [
      { key: 'animal.name', label: 'Name des Tieres', required: true },
      { key: 'animal.photo', label: 'Foto des Tieres', required: false },
    ],
    mediator: [
      { key: 'mediator.full_name', label: 'Vermittler:in', required: true },
    ],
    adopter: [
      { key: 'first_name', label: 'Vorname', required: true },
      { key: 'email', label: 'E-Mail', required: true },
    ],
  },
}

describe('adopterOptions', () => {
  it('offers the fields of the chosen animal type', () => {
    expect(adopterOptions(options, 'dog').map((o) => o.key)).toEqual([
      'date_of_birth',
      'id_card_number',
    ])
    expect(adopterOptions(options, 'cat').map((o) => o.key)).toEqual([
      'date_of_birth',
    ])
  })

  it('offers nothing without an animal type', () => {
    expect(adopterOptions(options, '')).toEqual([])
  })
})

describe('fieldLabel', () => {
  it('finds adopter labels of any animal type, and fixed fields', () => {
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
    expect(toFormData('dog')).toEqual({
      name: '',
      title: 'Schutzvertrag',
      body: '',
      animal_type_id: 'dog',
      animal_fields: [],
      mediator_fields: [],
      adopter_fields: [],
    })
  })
})
