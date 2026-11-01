import { describe, expect, it } from 'vitest'
import type { LinkedSettings } from '../api/types'
import {
  editorFieldFromSource,
  linkSourceStatus,
  linkableFieldLabel,
  recopyLinkedField,
} from './linked-field'
import { genderSource, idCardSource } from './linked-field.fixtures'

const settingsOf = (source = genderSource) =>
  editorFieldFromSource(source).settings as LinkedSettings

describe('linkSourceStatus', () => {
  it('is current when type, format and enum match', () => {
    expect(linkSourceStatus(settingsOf(), [idCardSource, genderSource])).toBe(
      'current'
    )
  })

  it('ignores wording and constraint changes of the source', () => {
    const source = {
      ...idCardSource,
      label: 'Personalausweis',
      schema: { type: 'string', maxLength: 20 },
    }
    expect(linkSourceStatus(settingsOf(idCardSource), [source])).toBe('current')
  })

  it('is changed when the enum differs', () => {
    const source = {
      ...genderSource,
      schema: { type: 'string', enum: ['male', 'female', 'unknown'] },
    }
    expect(linkSourceStatus(settingsOf(), [source])).toBe('changed')
  })

  it('is changed when the type or format differs', () => {
    const typed = { ...idCardSource, schema: { type: 'number' } }
    const formatted = {
      ...idCardSource,
      schema: { type: 'string', format: 'date' },
    }
    expect(linkSourceStatus(settingsOf(idCardSource), [typed])).toBe('changed')
    expect(linkSourceStatus(settingsOf(idCardSource), [formatted])).toBe(
      'changed'
    )
  })

  it('is removed when the source is gone', () => {
    expect(linkSourceStatus(settingsOf(), [idCardSource])).toBe('removed')
  })
})

describe('recopyLinkedField', () => {
  it('copies the new fragment and keeps the wording', () => {
    const field = {
      ...editorFieldFromSource(genderSource),
      label: 'Geschlecht des Tiers',
      required: true,
      settings: { ...settingsOf(), placeholder: 'Bitte wählen' },
    }
    const source = {
      ...genderSource,
      schema: { type: 'string', enum: ['male', 'female', 'unknown'] },
    }

    const updated = recopyLinkedField(field, source)

    expect(updated).toMatchObject({
      id: 'animal_gender',
      label: 'Geschlecht des Tiers',
      required: true,
      settings: { schema: source.schema, placeholder: 'Bitte wählen' },
    })
    expect(linkSourceStatus(updated.settings as LinkedSettings, [source])).toBe(
      'current'
    )
  })
})

describe('linkableFieldLabel', () => {
  it('names the group of a custom field', () => {
    expect(linkableFieldLabel(idCardSource)).toBe(
      'Ausweisnummer (Zusatzfeld: Ausweis)'
    )
    expect(linkableFieldLabel(genderSource)).toBe('Geschlecht')
  })
})
