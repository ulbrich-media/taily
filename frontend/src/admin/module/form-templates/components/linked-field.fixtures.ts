import type { LinkableField } from '@/api/types/custom-fields'

export const idCardSource: LinkableField = {
  field: 'custom.id_card_number',
  label: 'Ausweisnummer',
  kind: 'custom',
  group: 'Ausweis',
  key: 'person_id_card_number',
  schema: { type: 'string', maxLength: 50, description: 'Laut Ausweis' },
  ui_schema: {
    'ui:title': 'Ausweisnummer',
    'ui:placeholder': 'z. B. L01X00T47',
    'ui:options': {
      link: { entity: 'person', field: 'custom.id_card_number' },
    },
  },
}

export const genderSource: LinkableField = {
  field: 'core.gender',
  label: 'Geschlecht',
  kind: 'core',
  group: null,
  key: 'animal_gender',
  schema: { type: 'string', enum: ['male', 'female'] },
  ui_schema: {
    'ui:title': 'Geschlecht',
    'ui:options': {
      labels: [
        { value: 'male', label: 'Männlich' },
        { value: 'female', label: 'Weiblich' },
      ],
      link: { entity: 'animal', field: 'core.gender' },
    },
  },
}
