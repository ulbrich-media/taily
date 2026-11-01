import { describe, expect, it } from 'vitest'
import type { CustomFieldGroupResource } from '@/api/types/custom-fields'
import {
  describeGroupPlacement,
  describeGroupScope,
  templateFields,
} from './custom-field-group.utils'

describe('templateFields', () => {
  it('lists fields in ui:order with label and type, without headings', () => {
    expect(
      templateFields({
        schema: {
          type: 'object',
          properties: {
            notes: { type: 'string' },
            expected_size: { type: 'string', enum: ['s', 'l'] },
          },
        },
        ui_schema: {
          'ui:order': ['intro', 'expected_size', 'notes'],
          intro: { 'ui:widget': 'heading', 'ui:title': 'Allgemein' },
          expected_size: { 'ui:title': 'Erwartete Größe' },
          notes: { 'ui:widget': 'textarea' },
        },
      })
    ).toEqual([
      { key: 'expected_size', label: 'Erwartete Größe', type: 'select' },
      { key: 'notes', label: 'notes', type: 'textarea' },
    ])
  })

  it('returns nothing without a template', () => {
    expect(templateFields(undefined)).toEqual([])
  })
})

describe('describeGroupScope / describeGroupPlacement', () => {
  const base = {
    entity: 'person',
    section: 'basic',
    title: 'Ausweis',
    animal_types: [],
    person_roles: [],
  } as unknown as CustomFieldGroupResource

  it('describes empty scope as "alle"', () => {
    expect(describeGroupScope(base)).toBe('Alle Personen')
    expect(describeGroupScope({ ...base, entity: 'animal' })).toBe(
      'Alle Tierarten'
    )
  })

  it('lists roles and animal types', () => {
    expect(
      describeGroupScope({ ...base, person_roles: ['adopter', 'foster'] })
    ).toBe('Adoptant, Pflegestelle')
    expect(
      describeGroupScope({
        ...base,
        entity: 'animal',
        animal_types: [
          { id: '1', title: 'Hund' },
          { id: '2', title: 'Katze' },
        ],
      })
    ).toBe('Hund, Katze')
  })

  it('formats the placement like the builder banner', () => {
    expect(describeGroupPlacement(base)).toBe(
      'Person › Basis & Kontakt (Ausweis)'
    )
  })
})
