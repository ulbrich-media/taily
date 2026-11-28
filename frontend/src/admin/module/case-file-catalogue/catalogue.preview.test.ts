import { describe, expect, it } from 'vitest'
import type { AdoptionStep } from '@/api/types/case-file'
import type {
  CatalogueField,
  CatalogueGroup,
} from '@/api/types/case-file-catalogue'
import {
  previewFields,
  requiredAt,
  validatePreview,
  type PreviewRole,
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

describe('previewFields', () => {
  const catalogueGroups: CatalogueGroup[] = [
    {
      id: 'g',
      title: 'G',
      intro: '',
      fields: [
        field({ key: 'a' }),
        field({ key: 'later', collect_at: 'contract' }),
        field({ key: 'internal', visible_to_applicant: false }),
        field({ key: 'no_inspector', visible_to_inspector: false }),
        field({ key: 'gone', archived_at: '2026-01-01' }),
      ],
    },
    {
      id: 'empty',
      title: 'Leer',
      intro: '',
      fields: [field({ key: 'x', collect_at: 'handover' })],
    },
  ]
  const keys = (step: AdoptionStep, role: PreviewRole) =>
    previewFields(catalogueGroups, step, role).flatMap((group) =>
      group.fields.map((f) => f.key)
    )

  it('filters by role', () => {
    expect(keys('application', 'applicant')).toEqual(['a', 'no_inspector'])
    expect(keys('application', 'inspector')).toEqual(['a', 'internal'])
    expect(keys('application', 'mediator')).toEqual([
      'a',
      'internal',
      'no_inspector',
    ])
  })

  it('filters by step and drops archived fields and empty groups', () => {
    expect(keys('contract', 'mediator')).toContain('later')
    expect(keys('contract', 'mediator')).not.toContain('gone')
    expect(
      previewFields(catalogueGroups, 'application', 'mediator').map(
        (group) => group.id
      )
    ).toEqual(['g'])
  })
})

describe('requiredAt', () => {
  it('is only set once the step is reached', () => {
    const f = field({ required_for: 'contract' })
    expect(requiredAt(f, 'application')).toBeNull()
    expect(requiredAt(f, 'contract')).toBe('contract')
    expect(requiredAt(f, 'handover')).toBe('contract')
  })

  it('is never set for info blocks or optional fields', () => {
    const info = field({ type: 'info', required_for: 'application' })
    expect(requiredAt(info, 'handover')).toBeNull()
    expect(requiredAt(field({}), 'handover')).toBeNull()
  })
})

describe('validatePreview', () => {
  const run = (
    fields: CatalogueField[],
    values: Record<string, unknown>,
    step: AdoptionStep = 'application'
  ) =>
    validatePreview(
      fields,
      values,
      new Map(fields.map((f) => [f.key, f])),
      step
    )

  it('flags missing required values, including incomplete addresses', () => {
    const fields = [
      field({ key: 'name', required_for: 'application' }),
      field({ key: 'home', type: 'address', required_for: 'application' }),
      field({ key: 'later', required_for: 'contract' }),
    ]
    expect(Object.keys(run(fields, { home: { street_line: 'x' } }))).toEqual([
      'name',
      'home',
    ])
    expect(Object.keys(run(fields, {}, 'contract'))).toEqual([
      'name',
      'home',
      'later',
    ])
  })

  it('checks number range, choices, email and date', () => {
    const fields = [
      field({ key: 'n', type: 'integer', options: { min: 1, max: 5 } }),
      field({
        key: 'c',
        type: 'select',
        options: { choices: [{ value: 'a', label: 'A' }] },
      }),
      field({ key: 'e', type: 'email' }),
      field({ key: 'd', type: 'date' }),
    ]
    expect(
      Object.keys(run(fields, { n: '9', c: 'z', e: 'nope', d: '2026-02-31' }))
    ).toEqual(['n', 'c', 'e', 'd'])
    expect(
      run(fields, { n: '3', c: 'a', e: 'a@b.de', d: '2026-02-03' })
    ).toEqual({})
  })

  it('skips fields that do not apply', () => {
    const fields = [
      field({ key: 'rent', type: 'boolean' }),
      field({
        key: 'landlord',
        required_for: 'application',
        condition: { field: 'rent', equals: true },
      }),
    ]
    expect(run(fields, { rent: false })).toEqual({})
    expect(Object.keys(run(fields, { rent: true }))).toEqual(['landlord'])
  })
})
