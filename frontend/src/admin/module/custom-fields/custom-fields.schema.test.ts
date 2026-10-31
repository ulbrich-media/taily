import { describe, expect, it } from 'vitest'
import { jsonSchemaToZod } from '@/components/form/jsonSchemaToZod'
import {
  buildCustomFieldDefaults,
  buildCustomFieldsEditSchema,
  effectiveGroupSchema,
  groupsForSection,
  mergeCustomFieldSchemas,
  toCustomFieldsPayload,
} from './custom-fields.schema'
import { idCardGroup, makeGroup } from './custom-fields.fixtures'

describe('mergeCustomFieldSchemas', () => {
  it('merges the properties of all groups into one object schema', () => {
    const merged = mergeCustomFieldSchemas([makeGroup(), idCardGroup])

    expect(Object.keys(merged.properties ?? {})).toEqual([
      'expected_size',
      'coat_notes',
      'id_card_number',
      'verified',
    ])
    expect(merged.type).toBe('object')
    expect(merged.additionalProperties).toBeUndefined()
  })

  it('keeps required of in-scope groups and drops it for out-of-scope groups', () => {
    const merged = mergeCustomFieldSchemas([makeGroup(), idCardGroup])

    expect(merged.required).toEqual(['expected_size'])
  })

  it('returns an empty schema for no groups', () => {
    expect(mergeCustomFieldSchemas([])).toEqual({
      type: 'object',
      properties: {},
      required: [],
    })
  })

  it('produces a zod schema that enforces required only in scope', () => {
    const zod = jsonSchemaToZod(
      mergeCustomFieldSchemas([makeGroup(), idCardGroup])
    )

    // id_card_number is required in its template, but the group is out of scope
    expect(
      zod.safeParse({ expected_size: 'large', id_card_number: '' }).success
    ).toBe(true)
    expect(zod.safeParse({ id_card_number: 'X123' }).success).toBe(false)
  })
})

describe('effectiveGroupSchema', () => {
  it('returns the template schema unchanged for in-scope groups', () => {
    const group = makeGroup()
    expect(effectiveGroupSchema(group)).toBe(group.template.schema)
  })

  it('removes required for out-of-scope groups without touching the original', () => {
    const schema = effectiveGroupSchema(idCardGroup)
    expect(schema.required).toBeUndefined()
    expect(idCardGroup.template.schema.required).toEqual(['id_card_number'])
  })
})

describe('buildCustomFieldDefaults', () => {
  it('contains every key of every group, with stored values where present', () => {
    expect(
      buildCustomFieldDefaults([makeGroup(), idCardGroup], {
        expected_size: 'small',
        verified: true,
      })
    ).toEqual({
      expected_size: 'small',
      coat_notes: undefined,
      id_card_number: undefined,
      verified: true,
    })
  })

  it('ignores stored keys of groups not on the form (e.g. another section)', () => {
    expect(
      buildCustomFieldDefaults([makeGroup()], { other_section_key: 'x' })
    ).toEqual({ expected_size: undefined, coat_notes: undefined })
  })

  it('accepts null/undefined stored values', () => {
    expect(buildCustomFieldDefaults([makeGroup()], undefined)).toEqual({
      expected_size: undefined,
      coat_notes: undefined,
    })
  })
})

describe('toCustomFieldsPayload', () => {
  it('turns undefined into null so an emptied field clears the stored value', () => {
    expect(
      toCustomFieldsPayload({ a: undefined, b: '', c: 3, d: false })
    ).toEqual({ a: null, b: '', c: 3, d: false })
    expect(
      JSON.parse(JSON.stringify(toCustomFieldsPayload({ a: undefined })))
    ).toEqual({ a: null })
  })
})

describe('groupsForSection', () => {
  it('filters by section and sorts by position', () => {
    const extra = makeGroup({ id: 'g-extra', section: 'extra' })
    const second = makeGroup({ id: 'g-2', position: 5 })
    const first = makeGroup({ id: 'g-1', position: 1 })

    expect(
      groupsForSection([second, extra, first], 'basic').map((g) => g.id)
    ).toEqual(['g-1', 'g-2'])
    expect(groupsForSection(undefined, 'basic')).toEqual([])
  })
})

describe('buildCustomFieldsEditSchema', () => {
  const longGroup = makeGroup({
    template: {
      ...makeGroup().template,
      schema: {
        type: 'object',
        properties: {
          expected_size: { type: 'string', enum: ['small', 'large'] },
          coat_notes: { type: 'string', maxLength: 5 },
        },
        required: ['expected_size'],
      },
    },
  })

  it('does not require fields of a group whose values are unchanged', () => {
    const stored = { coat_notes: 'kurz' }
    const schema = buildCustomFieldsEditSchema([longGroup], { ...stored }, stored)

    expect(schema.safeParse({ coat_notes: 'kurz' }).success).toBe(true)
  })

  it('requires fields of a group with a changed value', () => {
    const stored = { coat_notes: 'kurz' }
    const values = { coat_notes: 'lang' }
    const schema = buildCustomFieldsEditSchema([longGroup], values, stored)

    expect(schema.safeParse(values).success).toBe(false)
  })

  it('keeps unchanged values that no longer pass the rules', () => {
    const stored = { expected_size: 'large', coat_notes: 'mittellang' }
    const schema = buildCustomFieldsEditSchema([longGroup], { ...stored }, stored)

    expect(schema.safeParse(stored).success).toBe(true)
  })

  it('validates changed values against the rules', () => {
    const stored = { expected_size: 'large', coat_notes: 'kurz' }
    const values = { expected_size: 'large', coat_notes: 'mittellang' }
    const schema = buildCustomFieldsEditSchema([longGroup], values, stored)

    expect(schema.safeParse(values).success).toBe(false)
  })

  it('treats empty values and an unset switch as unchanged', () => {
    const values = { id_card_number: '', verified: false }
    const schema = buildCustomFieldsEditSchema(
      [{ ...idCardGroup, in_scope: true }],
      values,
      {}
    )

    expect(schema.safeParse(values).success).toBe(true)
  })
})
