import { describe, expect, it } from 'vitest'
import { buildJsonSchema, parseJsonSchema } from './schema'
import { editorFieldFromSource } from './linked-field'
import { genderSource, idCardSource } from './linked-field.fixtures'
import { detectFieldType } from '@/lib/form-schema/detect-field-type'

describe('linked fields in parseJsonSchema / buildJsonSchema', () => {
  it('emits the copied fragment unchanged plus the link', () => {
    const { schema, uiSchema } = buildJsonSchema(
      [editorFieldFromSource(genderSource)],
      'Bericht'
    )

    expect(schema.properties).toEqual({ animal_gender: genderSource.schema })
    expect(uiSchema).toEqual({
      'ui:order': ['animal_gender'],
      animal_gender: genderSource.ui_schema,
    })
  })

  it('keeps the description as an editable field description', () => {
    const field = editorFieldFromSource(idCardSource)
    expect(field.description).toBe('Laut Ausweis')

    const { schema, uiSchema } = buildJsonSchema([field], 'Bewerbung')
    expect(schema.properties).toEqual({
      person_id_card_number: idCardSource.schema,
    })
    expect(uiSchema.person_id_card_number).toEqual(idCardSource.ui_schema)
  })

  it('detects a property with ui:options.link as linked field', () => {
    const fields = parseJsonSchema(
      {
        type: 'object',
        properties: {
          animal_gender: genderSource.schema,
          notes: { type: 'string', enum: ['a'] },
        },
        required: ['animal_gender'],
      },
      {
        'ui:order': ['animal_gender', 'notes'],
        animal_gender: { ...genderSource.ui_schema, 'ui:title': 'Rüde?' },
      }
    )

    expect(fields.map((f) => f.type)).toEqual(['linked', 'select'])
    expect(fields[0]).toMatchObject({
      id: 'animal_gender',
      label: 'Rüde?',
      required: true,
      settings: {
        link: { entity: 'animal', field: 'core.gender' },
        schema: genderSource.schema,
      },
    })
  })

  it('round-trips a reworded linked field', () => {
    const field = {
      ...editorFieldFromSource(idCardSource),
      label: 'Ihre Ausweisnummer',
      description: 'Steht auf der Rückseite',
      required: true,
    }
    const built = buildJsonSchema([field], 'Bewerbung')
    const parsed = parseJsonSchema(built.schema, built.uiSchema)

    expect(parsed).toEqual([field])
    expect(buildJsonSchema(parsed, 'Bewerbung')).toEqual(built)
    expect(built.uiSchema.person_id_card_number).toEqual({
      ...idCardSource.ui_schema,
      'ui:title': 'Ihre Ausweisnummer',
    })
  })

  it('stays a plain property for renderers', () => {
    const { uiSchema } = buildJsonSchema(
      [editorFieldFromSource(genderSource)],
      'Bericht'
    )
    expect(
      detectFieldType(
        genderSource.schema,
        uiSchema.animal_gender as Record<string, never>
      )
    ).toBe('select')
  })
})
