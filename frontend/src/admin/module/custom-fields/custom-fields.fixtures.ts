import type { CustomFieldDefinitionGroup } from '@/api/types/custom-fields'

export function makeGroup(
  overrides: Partial<CustomFieldDefinitionGroup> = {}
): CustomFieldDefinitionGroup {
  return {
    id: 'g-size',
    title: 'Größe',
    section: 'basic',
    position: 0,
    in_scope: true,
    field_settings: {},
    template: {
      id: 't-size',
      version_id: 'v-size',
      schema: {
        type: 'object',
        properties: {
          expected_size: { type: 'string', enum: ['small', 'large'] },
          coat_notes: { type: 'string' },
        },
        required: ['expected_size'],
        additionalProperties: false,
      },
      ui_schema: {
        'ui:order': ['expected_size', 'coat_notes'],
        expected_size: {
          'ui:title': 'Erwartete Größe',
          'ui:options': {
            labels: [
              { value: 'small', label: 'Klein' },
              { value: 'large', label: 'Groß' },
            ],
          },
        },
        coat_notes: { 'ui:title': 'Fellnotizen' },
      },
    },
    ...overrides,
  }
}

export const idCardGroup = makeGroup({
  id: 'g-id',
  title: 'Ausweis',
  position: 1,
  in_scope: false,
  template: {
    id: 't-id',
    version_id: 'v-id',
    schema: {
      type: 'object',
      properties: {
        id_card_number: { type: 'string' },
        verified: { type: 'boolean' },
      },
      required: ['id_card_number'],
    },
    ui_schema: {
      id_card_number: { 'ui:title': 'Ausweisnummer' },
      verified: { 'ui:title': 'Geprüft' },
    },
  },
})
