import { describe, it, expect } from 'vitest'
import { jsonSchemaToZod, buildFormDataDefaults } from './jsonSchemaToZod'
import type { JsonSchema, JsonSchemaProperty } from '@/api/types/form-schemas'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseField(prop: JsonSchemaProperty, required: boolean, value: unknown) {
  return jsonSchemaToZod({
    properties: { field: prop },
    required: required ? ['field'] : [],
  }).safeParse({ field: value })
}

function ok(prop: JsonSchemaProperty, required: boolean, value: unknown) {
  const r = parseField(prop, required, value)
  expect(r.success, `Expected success for ${JSON.stringify(value)}, got: ${r.error?.issues[0]?.message}`).toBe(true)
}

function fail(prop: JsonSchemaProperty, required: boolean, value: unknown, expectedMsg?: string) {
  const r = parseField(prop, required, value)
  expect(r.success, `Expected failure for ${JSON.stringify(value)}`).toBe(false)
  if (expectedMsg) {
    const issue = r.error?.issues.find((i) => i.path[0] === 'field')
    expect(issue?.message).toBe(expectedMsg)
  }
}

// ---------------------------------------------------------------------------
// buildFormDataDefaults
// ---------------------------------------------------------------------------

describe('buildFormDataDefaults', () => {
  const schema: JsonSchema = {
    properties: {
      full_name: { type: 'string' },
      agree: { type: 'boolean' },
      age: { type: 'integer' },
    },
    required: ['full_name'],
  }

  it('returns an object with every schema key present', () => {
    const result = buildFormDataDefaults(schema, {})
    expect(Object.keys(result)).toEqual(['full_name', 'agree', 'age'])
  })

  it('sets undefined for keys absent in existing data', () => {
    const result = buildFormDataDefaults(schema, {})
    expect(result.full_name).toBeUndefined()
    expect(result.agree).toBeUndefined()
    expect(result.age).toBeUndefined()
  })

  it('preserves existing data values', () => {
    const result = buildFormDataDefaults(schema, { full_name: 'Max', agree: true, age: 30 })
    expect(result.full_name).toBe('Max')
    expect(result.agree).toBe(true)
    expect(result.age).toBe(30)
  })

  it('carries known keys and drops extra keys not in the schema', () => {
    const result = buildFormDataDefaults(schema, { full_name: 'Max', extra_field: 'ignored' })
    expect(result.full_name).toBe('Max')
    expect('extra_field' in result).toBe(false)
  })

  it('returns existing data unchanged when schema has no properties', () => {
    const data = { foo: 'bar' }
    expect(buildFormDataDefaults({ type: 'object' }, data)).toBe(data)
  })

  it('returns existing data unchanged when schema is null', () => {
    const data = { foo: 'bar' }
    expect(buildFormDataDefaults(null, data)).toBe(data)
  })

  it('returns empty object as default when called without existingData', () => {
    const result = buildFormDataDefaults(null)
    expect(result).toEqual({})
  })

  it('isDirty remains false — structural equality with Controller-registered fields', () => {
    // Simulates the react-hook-form isDirty scenario: after buildFormDataDefaults,
    // the defaultValues object has the same keys that DynamicFormFields Controllers
    // will register, so the deep-equal check stays true.
    const defaults = buildFormDataDefaults(schema, {})
    const afterRegistration = { full_name: undefined, agree: undefined, age: undefined }
    expect(JSON.stringify(defaults)).toBe(JSON.stringify(afterRegistration))
  })
})

// ---------------------------------------------------------------------------
// The exact Formular-Showcase schema from FormTemplateSeeder.php
// ---------------------------------------------------------------------------

const SHOWCASE_SCHEMA: JsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Formular-Showcase',
  type: 'object',
  required: [
    'full_name',
    'email',
    'birth_date',
    'rating',
    'category',
    'contact_method',
    'agree',
  ],
  properties: {
    full_name: { type: 'string', minLength: 2, maxLength: 100 },
    notes: { type: 'string', maxLength: 1000 },
    rating: { type: 'number', minimum: 0, maximum: 10, multipleOf: 0.5 },
    age: { type: 'integer', minimum: 0, maximum: 120 },
    agree: { type: 'boolean' },
    category: { type: 'string', enum: ['bronze', 'silver', 'gold', 'platinum'] },
    contact_method: { type: 'string', enum: ['email', 'phone', 'post'] },
    birth_date: { type: 'string', format: 'date' },
    email: { type: 'string', format: 'email' },
    phone_number: { type: 'string', format: 'phone' },
  },
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('jsonSchemaToZod', () => {
  // -------------------------------------------------------------------------
  // Edge cases — null / undefined / empty schema
  // -------------------------------------------------------------------------
  describe('null / undefined / empty schema', () => {
    it('accepts any object when schema is null', () => {
      expect(jsonSchemaToZod(null).safeParse({ anything: 'goes' }).success).toBe(true)
    })

    it('accepts any object when schema is undefined', () => {
      expect(jsonSchemaToZod(undefined).safeParse({ foo: 42 }).success).toBe(true)
    })

    it('accepts any object when properties is absent', () => {
      expect(jsonSchemaToZod({ type: 'object' }).safeParse({ x: 1 }).success).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // String fields
  // -------------------------------------------------------------------------
  describe('string fields', () => {
    const str: JsonSchemaProperty = { type: 'string' }

    it('required — rejects undefined', () => {
      fail(str, true, undefined, 'Dieses Feld ist erforderlich')
    })

    it('required — rejects empty string', () => {
      fail(str, true, '', 'Dieses Feld ist erforderlich')
    })

    it('required — accepts non-empty string', () => {
      ok(str, true, 'hello')
    })

    it('optional — accepts undefined', () => {
      ok(str, false, undefined)
    })

    it('optional — accepts empty string', () => {
      ok(str, false, '')
    })

    it('minLength — rejects string shorter than minimum', () => {
      const prop: JsonSchemaProperty = { type: 'string', minLength: 2 }
      fail(prop, true, 'A', 'Mindestens 2 Zeichen')
    })

    it('minLength — accepts string at exactly minimum length', () => {
      const prop: JsonSchemaProperty = { type: 'string', minLength: 2 }
      ok(prop, true, 'AB')
    })

    it('maxLength — rejects string longer than maximum', () => {
      const prop: JsonSchemaProperty = { type: 'string', maxLength: 5 }
      fail(prop, false, 'toolong', 'Maximal 5 Zeichen')
    })

    it('maxLength — accepts string at exactly maximum length', () => {
      const prop: JsonSchemaProperty = { type: 'string', maxLength: 5 }
      ok(prop, false, 'exact')
    })

    it('minLength + maxLength — rejects both extremes', () => {
      const prop: JsonSchemaProperty = { type: 'string', minLength: 2, maxLength: 10 }
      fail(prop, true, 'A')
      fail(prop, true, 'toolongvalue')
    })

    it('minLength + maxLength — accepts value in range', () => {
      const prop: JsonSchemaProperty = { type: 'string', minLength: 2, maxLength: 10 }
      ok(prop, true, 'hello')
    })
  })

  // -------------------------------------------------------------------------
  // format: email
  // -------------------------------------------------------------------------
  describe('format: email', () => {
    const emailProp: JsonSchemaProperty = { type: 'string', format: 'email' }

    it('required — rejects undefined', () => {
      fail(emailProp, true, undefined, 'Dieses Feld ist erforderlich')
    })

    it('required — rejects empty string', () => {
      fail(emailProp, true, '')
    })

    it('required — rejects invalid email address', () => {
      fail(emailProp, true, 'not-an-email', 'Bitte eine gültige E-Mail-Adresse eingeben')
    })

    it('required — rejects address without domain', () => {
      fail(emailProp, true, 'user@', 'Bitte eine gültige E-Mail-Adresse eingeben')
    })

    it('required — accepts valid email', () => {
      ok(emailProp, true, 'max@beispiel.de')
    })

    it('optional — accepts undefined', () => {
      ok(emailProp, false, undefined)
    })

    it('optional — still rejects malformed address when a value is provided', () => {
      fail(emailProp, false, 'not-an-email', 'Bitte eine gültige E-Mail-Adresse eingeben')
    })

    it('optional — accepts valid email', () => {
      ok(emailProp, false, 'test@example.com')
    })
  })

  // -------------------------------------------------------------------------
  // format: date
  // -------------------------------------------------------------------------
  describe('format: date', () => {
    const dateProp: JsonSchemaProperty = { type: 'string', format: 'date' }

    it('required — rejects undefined', () => {
      fail(dateProp, true, undefined, 'Dieses Feld ist erforderlich')
    })

    it('required — rejects empty string', () => {
      fail(dateProp, true, '', 'Dieses Feld ist erforderlich')
    })

    it('required — accepts date string', () => {
      ok(dateProp, true, '2000-06-15')
    })

    it('optional — accepts undefined', () => {
      ok(dateProp, false, undefined)
    })
  })

  // -------------------------------------------------------------------------
  // format: phone
  // -------------------------------------------------------------------------
  describe('format: phone', () => {
    const phoneProp: JsonSchemaProperty = { type: 'string', format: 'phone' }

    it('optional — accepts undefined', () => {
      ok(phoneProp, false, undefined)
    })

    it('optional — accepts phone string', () => {
      ok(phoneProp, false, '+49 123 456789')
    })

    it('required — rejects undefined', () => {
      fail(phoneProp, true, undefined, 'Dieses Feld ist erforderlich')
    })
  })

  // -------------------------------------------------------------------------
  // Number fields
  // -------------------------------------------------------------------------
  describe('number fields', () => {
    const num: JsonSchemaProperty = { type: 'number' }

    it('required — rejects undefined', () => {
      fail(num, true, undefined, 'Dieses Feld ist erforderlich')
    })

    it('required — rejects non-numeric string', () => {
      fail(num, true, 'abc', 'Dieses Feld ist erforderlich')
    })

    it('required — accepts zero', () => {
      ok(num, true, 0)
    })

    it('required — accepts positive float', () => {
      ok(num, true, 5.5)
    })

    it('optional — accepts undefined', () => {
      ok(num, false, undefined)
    })

    it('minimum — rejects value below minimum', () => {
      const prop: JsonSchemaProperty = { type: 'number', minimum: 0 }
      fail(prop, true, -1, 'Mindestwert: 0')
    })

    it('minimum — accepts value exactly at minimum', () => {
      const prop: JsonSchemaProperty = { type: 'number', minimum: 0 }
      ok(prop, true, 0)
    })

    it('maximum — rejects value above maximum', () => {
      const prop: JsonSchemaProperty = { type: 'number', maximum: 10 }
      fail(prop, true, 11, 'Maximalwert: 10')
    })

    it('maximum — accepts value exactly at maximum', () => {
      const prop: JsonSchemaProperty = { type: 'number', maximum: 10 }
      ok(prop, true, 10)
    })

    it('multipleOf — rejects non-multiple', () => {
      const prop: JsonSchemaProperty = { type: 'number', multipleOf: 0.5 }
      fail(prop, true, 5.3, 'Muss ein Vielfaches von 0.5 sein')
    })

    it('multipleOf — accepts exact multiple', () => {
      const prop: JsonSchemaProperty = { type: 'number', multipleOf: 0.5 }
      ok(prop, true, 5.5)
    })

    it('multipleOf — accepts zero', () => {
      const prop: JsonSchemaProperty = { type: 'number', multipleOf: 0.5 }
      ok(prop, true, 0)
    })
  })

  // -------------------------------------------------------------------------
  // Integer fields
  // -------------------------------------------------------------------------
  describe('integer fields', () => {
    const int: JsonSchemaProperty = { type: 'integer' }

    it('required — rejects undefined', () => {
      fail(int, true, undefined, 'Dieses Feld ist erforderlich')
    })

    it('required — rejects float', () => {
      fail(int, true, 30.5, 'Bitte eine ganze Zahl eingeben')
    })

    it('required — accepts whole number', () => {
      ok(int, true, 30)
    })

    it('required — accepts zero', () => {
      ok(int, true, 0)
    })

    it('optional — accepts undefined', () => {
      ok(int, false, undefined)
    })

    it('optional — rejects float even when optional', () => {
      fail(int, false, 1.5, 'Bitte eine ganze Zahl eingeben')
    })

    it('minimum — rejects value below minimum', () => {
      const prop: JsonSchemaProperty = { type: 'integer', minimum: 0 }
      fail(prop, true, -1, 'Mindestwert: 0')
    })

    it('maximum — rejects value above maximum', () => {
      const prop: JsonSchemaProperty = { type: 'integer', maximum: 120 }
      fail(prop, true, 121, 'Maximalwert: 120')
    })

    it('minimum + maximum — accepts value in range', () => {
      const prop: JsonSchemaProperty = { type: 'integer', minimum: 0, maximum: 120 }
      ok(prop, false, 42)
    })
  })

  // -------------------------------------------------------------------------
  // Boolean fields
  // -------------------------------------------------------------------------
  describe('boolean fields', () => {
    const bool: JsonSchemaProperty = { type: 'boolean' }

    describe('required', () => {
      it('accepts true', () => {
        ok(bool, true, true)
      })

      it('rejects false — required switch must be enabled', () => {
        fail(bool, true, false, 'Dieses Feld ist erforderlich')
      })

      it('rejects undefined — untouched required switch is coerced to false, then fails', () => {
        fail(bool, true, undefined, 'Dieses Feld ist erforderlich')
      })
    })

    describe('optional', () => {
      it('accepts true', () => {
        ok(bool, false, true)
      })

      it('accepts false', () => {
        ok(bool, false, false)
      })

      it('coerces undefined to false — untouched optional switch does not block submission', () => {
        ok(bool, false, undefined)
      })

      it('coerced value is false, not undefined', () => {
        const schema = jsonSchemaToZod({ properties: { field: bool }, required: [] })
        const result = schema.safeParse({ field: undefined })
        expect(result.success).toBe(true)
        if (result.success) expect((result.data as Record<string, unknown>).field).toBe(false)
      })
    })
  })

  // -------------------------------------------------------------------------
  // Enum fields
  // -------------------------------------------------------------------------
  describe('enum fields', () => {
    const enumProp: JsonSchemaProperty = {
      type: 'string',
      enum: ['bronze', 'silver', 'gold', 'platinum'],
    }

    it('required — rejects undefined', () => {
      fail(enumProp, true, undefined, 'Bitte eine Option auswählen')
    })

    it('required — rejects value not in enum', () => {
      fail(enumProp, true, 'diamond', 'Bitte eine Option auswählen')
    })

    it('required — accepts valid enum value', () => {
      ok(enumProp, true, 'gold')
    })

    it('optional — accepts undefined', () => {
      ok(enumProp, false, undefined)
    })

    it('optional — rejects invalid value even when optional', () => {
      fail(enumProp, false, 'diamond', 'Bitte eine Option auswählen')
    })

    it('optional — accepts valid enum value', () => {
      ok(enumProp, false, 'silver')
    })
  })

  // -------------------------------------------------------------------------
  // Formular-Showcase — full integration
  // -------------------------------------------------------------------------
  describe('Formular-Showcase integration', () => {
    const parse = (data: Record<string, unknown>) =>
      jsonSchemaToZod(SHOWCASE_SCHEMA).safeParse(data)

    const VALID_SUBMISSION = {
      full_name: 'Max Mustermann',
      email: 'max@beispiel.de',
      birth_date: '1990-05-15',
      rating: 7.5,
      category: 'gold',
      contact_method: 'email',
      agree: true,
      // optional fields omitted
    }

    it('accepts a fully valid required-only submission', () => {
      expect(parse(VALID_SUBMISSION).success).toBe(true)
    })

    it('accepts a fully filled submission including optional fields', () => {
      const result = parse({
        ...VALID_SUBMISSION,
        notes: 'Freundlicher Bewerber.',
        age: 34,
        phone_number: '+49 123 456789',
      })
      expect(result.success).toBe(true)
    })

    it('rejects when required string field is missing', () => {
      const { full_name: _, ...without } = VALID_SUBMISSION
      expect(parse(without).success).toBe(false)
    })

    it('rejects full_name shorter than minLength 2', () => {
      expect(parse({ ...VALID_SUBMISSION, full_name: 'A' }).success).toBe(false)
    })

    it('rejects full_name longer than maxLength 100', () => {
      expect(parse({ ...VALID_SUBMISSION, full_name: 'A'.repeat(101) }).success).toBe(false)
    })

    it('rejects invalid email address', () => {
      expect(parse({ ...VALID_SUBMISSION, email: 'not-an-email' }).success).toBe(false)
    })

    it('rejects rating outside allowed range', () => {
      expect(parse({ ...VALID_SUBMISSION, rating: -1 }).success).toBe(false)
      expect(parse({ ...VALID_SUBMISSION, rating: 11 }).success).toBe(false)
    })

    it('rejects rating that is not a multiple of 0.5', () => {
      expect(parse({ ...VALID_SUBMISSION, rating: 7.3 }).success).toBe(false)
    })

    it('accepts rating at boundary values', () => {
      expect(parse({ ...VALID_SUBMISSION, rating: 0 }).success).toBe(true)
      expect(parse({ ...VALID_SUBMISSION, rating: 10 }).success).toBe(true)
    })

    it('rejects unknown category value', () => {
      expect(parse({ ...VALID_SUBMISSION, category: 'diamond' }).success).toBe(false)
    })

    it('rejects unknown contact_method value', () => {
      expect(parse({ ...VALID_SUBMISSION, contact_method: 'fax' }).success).toBe(false)
    })

    it('rejects agree = false — required switch must be enabled', () => {
      expect(parse({ ...VALID_SUBMISSION, agree: false }).success).toBe(false)
    })

    it('rejects agree = undefined — untouched required switch blocks submission', () => {
      const { agree: _, ...without } = VALID_SUBMISSION
      expect(parse(without).success).toBe(false)
    })

    it('rejects float value for optional integer age', () => {
      expect(parse({ ...VALID_SUBMISSION, age: 34.5 }).success).toBe(false)
    })

    it('rejects age above maximum 120', () => {
      expect(parse({ ...VALID_SUBMISSION, age: 150 }).success).toBe(false)
    })

    it('rejects notes longer than maxLength 1000', () => {
      expect(
        parse({ ...VALID_SUBMISSION, notes: 'x'.repeat(1001) }).success
      ).toBe(false)
    })

    it('accepts notes at exactly maxLength 1000', () => {
      expect(
        parse({ ...VALID_SUBMISSION, notes: 'x'.repeat(1000) }).success
      ).toBe(true)
    })

    it('accepts optional fields as undefined', () => {
      const result = parse({
        ...VALID_SUBMISSION,
        notes: undefined,
        age: undefined,
        phone_number: undefined,
      })
      expect(result.success).toBe(true)
    })
  })
})
