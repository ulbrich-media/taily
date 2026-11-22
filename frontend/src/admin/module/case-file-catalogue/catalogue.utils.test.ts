import { describe, expect, it } from 'vitest'
import type {
  CatalogueField,
  CatalogueGroup,
} from '@/api/types/case-file-catalogue'
import {
  conditionCandidates,
  conditionSummary,
  keyFromLabel,
  moved,
  NO_CONDITION,
  OPTIONAL,
  stepSummary,
  toRequest,
  type FieldDefinitionFormData,
} from './catalogue.utils'

function field(overrides: Partial<CatalogueField>): CatalogueField {
  return {
    id: overrides.key ?? 'id',
    key: 'key',
    label: 'Feld',
    help: '',
    type: 'text',
    options: null,
    built_in: false,
    collect_at: 'application',
    required_for: null,
    requires_review: false,
    visible_to_applicant: true,
    visible_to_inspector: true,
    condition: null,
    archived_at: null,
    ...overrides,
  }
}

const groups: CatalogueGroup[] = [
  {
    id: 'about',
    title: 'Über dich',
    intro: '',
    fields: [
      field({ key: 'first_name' }),
      field({ key: 'is_tenant', type: 'boolean', label: 'Miete' }),
    ],
  },
  {
    id: 'home',
    title: 'Wohnsituation',
    intro: '',
    fields: [
      field({
        key: 'housing',
        type: 'select',
        label: 'Wohnform',
        options: {
          choices: [
            { value: 'apartment', label: 'Wohnung' },
            { value: 'house', label: 'Haus' },
          ],
        },
      }),
      field({ key: 'has_garden', type: 'boolean', label: 'Garten' }),
      field({ key: 'old', type: 'boolean', archived_at: '2026-01-01' }),
      field({ key: 'garden_size', type: 'integer' }),
    ],
  },
  {
    id: 'later',
    title: 'Ankunft',
    intro: '',
    fields: [field({ key: 'harness', type: 'boolean' })],
  },
]

describe('conditionCandidates', () => {
  it('offers only active yes/no and choice fields above the field', () => {
    expect(
      conditionCandidates(groups, {
        groupId: 'home',
        fieldId: 'garden_size',
      }).map((f) => f.key)
    ).toEqual(['is_tenant', 'housing', 'has_garden'])
  })

  it('treats a new field as appended to its group', () => {
    expect(
      conditionCandidates(groups, { groupId: 'about' }).map((f) => f.key)
    ).toEqual(['is_tenant'])
  })
})

describe('summaries', () => {
  it('describes steps', () => {
    expect(stepSummary(field({ required_for: 'contract' }))).toBe(
      'Erfragt ab Bewerbung · Pflicht ab Vertrag'
    )
    expect(stepSummary(field({}))).toBe('Erfragt ab Bewerbung · optional')
  })

  it('describes conditions with labels', () => {
    expect(
      conditionSummary(
        field({ condition: { field: 'housing', in: ['apartment'] } }),
        groups
      )
    ).toBe('Nur wenn „Wohnform“ = Wohnung')
    expect(
      conditionSummary(
        field({ condition: { field: 'has_garden', equals: true } }),
        groups
      )
    ).toBe('Nur wenn „Garten“ = Ja')
  })
})

describe('moved', () => {
  it('swaps with the neighbour and stops at the ends', () => {
    expect(moved(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c'])
    expect(moved(['a', 'b', 'c'], 'c', 1)).toEqual(['a', 'b', 'c'])
  })
})

describe('keyFromLabel', () => {
  it('turns a German label into a key', () => {
    expect(keyFromLabel('Größe des Gartens (m²)')).toBe('groesse_des_gartens_m')
    expect(keyFromLabel('2. Telefonnummer')).toBe('telefonnummer')
  })
})

describe('toRequest', () => {
  const base: FieldDefinitionFormData = {
    type: 'integer',
    key: 'fence_height',
    label: 'Höhe des Zauns',
    help: '',
    field_group_id: 'home',
    collect_at: 'application',
    required_for: OPTIONAL,
    requires_review: false,
    visible_to_applicant: true,
    visible_to_inspector: true,
    choices: [{ value: 'wood', label: 'Holz' }],
    min: '50',
    max: '',
    condition_field: 'fence_type',
    condition_equals: 'true',
    condition_in: ['metal'],
  }

  it('builds a new field with range and choice condition', () => {
    expect(
      toRequest(base, { isNew: true, builtIn: false, controllerType: 'radio' })
    ).toEqual({
      key: 'fence_height',
      type: 'integer',
      label: 'Höhe des Zauns',
      help: '',
      field_group_id: 'home',
      collect_at: 'application',
      required_for: null,
      requires_review: false,
      visible_to_applicant: true,
      visible_to_inspector: true,
      options: { min: 50 },
      condition: { field: 'fence_type', in: ['metal'] },
    })
  })

  it('uses equals for a yes/no controller and drops stale choices', () => {
    expect(
      toRequest(base, {
        isNew: false,
        builtIn: false,
        controllerType: 'boolean',
      }).condition
    ).toEqual({ field: 'fence_type', equals: true })
  })

  it('sends no condition when none is chosen', () => {
    expect(
      toRequest(
        { ...base, condition_field: NO_CONDITION },
        { isNew: false, builtIn: false }
      ).condition
    ).toBeNull()
  })

  it('only sends presentation and steps for built-in fields', () => {
    const request = toRequest(
      { ...base, required_for: 'contract' },
      { isNew: false, builtIn: true }
    )
    expect(request).not.toHaveProperty('condition')
    expect(request).not.toHaveProperty('options')
    expect(request).not.toHaveProperty('key')
    expect(request.required_for).toBe('contract')
  })
})
