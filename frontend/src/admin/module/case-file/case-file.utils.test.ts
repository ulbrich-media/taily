import { describe, expect, it } from 'vitest'
import type { CaseFileField } from '@/api/types/case-file'
import {
  fieldApplies,
  formatValue,
  isPresent,
  toApiValue,
  requirementLabel,
} from './case-file.utils'

function field(overrides: Partial<CaseFileField>): CaseFileField {
  return {
    key: 'field',
    label: 'Feld',
    help: '',
    type: 'text',
    options: null,
    built_in: false,
    collect_at: 'application',
    required_for: null,
    effective_required_for: null,
    in_contract: false,
    condition: null,
    applies: true,
    requires_review: false,
    visible_to_applicant: true,
    visible_to_inspector: true,
    value: null,
    review_status: null,
    override: null,
    status: null,
    updated_at: null,
    ...overrides,
  }
}

const hasGarden = field({ key: 'has_garden', type: 'boolean' })
const gardenSize = field({
  key: 'garden_size',
  type: 'integer',
  condition: { field: 'has_garden', equals: true },
})
const fenced = field({
  key: 'fenced',
  type: 'boolean',
  condition: { field: 'garden_size', equals: 1 },
})
const housing = field({
  key: 'housing',
  type: 'select',
  options: {
    choices: [
      { value: 'apartment', label: 'Wohnung' },
      { value: 'house', label: 'Haus' },
    ],
  },
})
const landlord = field({
  key: 'landlord',
  type: 'boolean',
  condition: { field: 'housing', in: ['apartment'] },
})
const fields = new Map(
  [hasGarden, gardenSize, fenced, housing, landlord].map((f) => [f.key, f])
)

describe('fieldApplies', () => {
  it('applies fields without a condition', () => {
    expect(fieldApplies(hasGarden, {}, fields)).toBe(true)
  })

  it('follows an equals condition live', () => {
    expect(fieldApplies(gardenSize, { has_garden: false }, fields)).toBe(false)
    expect(fieldApplies(gardenSize, { has_garden: true }, fields)).toBe(true)
  })

  it('follows an in condition', () => {
    expect(fieldApplies(landlord, { housing: 'apartment' }, fields)).toBe(true)
    expect(fieldApplies(landlord, { housing: 'house' }, fields)).toBe(false)
  })

  it('does not apply when the controlling field does not apply', () => {
    expect(
      fieldApplies(fenced, { has_garden: false, garden_size: 1 }, fields)
    ).toBe(false)
  })

  it('does not apply when the controlling field is unknown', () => {
    const orphan = field({ condition: { field: 'missing', equals: true } })
    expect(fieldApplies(orphan, { missing: true }, fields)).toBe(false)
  })
})

describe('isPresent', () => {
  it('treats false and 0 as answers but blank strings as missing', () => {
    expect(isPresent(hasGarden, false)).toBe(true)
    expect(isPresent(gardenSize, 0)).toBe(true)
    expect(isPresent(field({}), '  ')).toBe(false)
  })

  it('needs street, postal code and city for an address', () => {
    const address = field({ type: 'address' })
    expect(isPresent(address, { street_line: 'Weg 1', city: 'Köln' })).toBe(
      false
    )
    expect(
      isPresent(address, {
        street_line: 'Weg 1',
        postal_code: '50667',
        city: 'Köln',
      })
    ).toBe(true)
  })
})

describe('formatValue', () => {
  it('formats booleans, choices, dates and addresses for display', () => {
    expect(formatValue(hasGarden, true)).toBe('Ja')
    expect(formatValue(housing, 'house')).toBe('Haus')
    expect(formatValue(field({ type: 'date' }), '1990-04-12')).toBe(
      '12.04.1990'
    )
    expect(
      formatValue(field({ type: 'address' }), {
        street_line: 'Hauptstr. 1',
        street_line_additional: '',
        postal_code: '50667',
        city: 'Köln',
        country_code: 'DE',
      })
    ).toBe('Hauptstr. 1, 50667 Köln, DE')
    expect(formatValue(hasGarden, null)).toBe('')
  })
})

describe('toApiValue', () => {
  it('sends numbers as numbers and empty inputs as null', () => {
    expect(toApiValue(gardenSize, '120')).toBe(120)
    expect(toApiValue(gardenSize, '')).toBeNull()
    expect(toApiValue(field({}), 'Text')).toBe('Text')
  })
})

describe('requirementLabel', () => {
  it('describes the effective requirement', () => {
    expect(
      requirementLabel(field({ effective_required_for: 'contract' }))
    ).toBe('Pflicht ab Vertrag')
    expect(requirementLabel(field({}))).toBe('Optional')
    expect(
      requirementLabel(
        field({ override: { required_for: null, waived: true } })
      )
    ).toBe('Für diese Vermittlung nicht nötig')
    expect(requirementLabel(field({ applies: false }))).toBe('Trifft nicht zu')
  })
})
