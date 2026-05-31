import { z } from 'zod'
import {
  format,
  isAfter,
  isBefore,
  isValid,
  parse,
  parseISO,
  startOfDay,
} from 'date-fns'

// Zod schema for date fields backed by DateInput.
// Validates that the value is a German-format date (dd.MM.yyyy) or null/empty.
// The form always stores German format — use toApiDate() before submitting to the API.
export const zFieldDate = z
  .string()
  .nullable()
  .refine(
    (val) => !val || isValid(parse(val, 'dd.MM.yyyy', new Date())),
    'Ungültiges Datum'
  )

export const zFieldDateNoFuture = zFieldDate.refine((val) => {
  if (!val) return true
  const parsed = parse(val, 'dd.MM.yyyy', new Date())
  return isValid(parsed) && !isAfter(startOfDay(parsed), startOfDay(new Date()))
}, 'Datum darf nicht in der Zukunft liegen')

export const zFieldDateNoPast = zFieldDate.refine((val) => {
  if (!val) return true
  const parsed = parse(val, 'dd.MM.yyyy', new Date())
  return (
    isValid(parsed) && !isBefore(startOfDay(parsed), startOfDay(new Date()))
  )
}, 'Datum darf nicht in der Vergangenheit liegen')

// Converts a German display string (dd.MM.yyyy) to ISO (yyyy-MM-dd) for the API.
// Call this in the form's submit handler, not inside the schema.
export function toApiDate(value: string | null | undefined): string | null {
  if (!value) return null
  const parsed = parse(value, 'dd.MM.yyyy', new Date())
  return isValid(parsed) ? format(parsed, 'yyyy-MM-dd') : null
}

// Parses a German display string (dd.MM.yyyy) to a date object or fails
export function parseGermanDate(value: string): Date | undefined {
  const parsed = parse(value, 'dd.MM.yyyy', new Date())
  return isValid(parsed) ? parsed : undefined
}

// Converts an API date value (ISO datetime or yyyy-MM-dd) to German display format
// for use as a defaultValue in forms backed by dateFieldSchema.
export function toDateFieldValue(
  value: string | null | undefined
): string | null {
  if (!value) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'dd.MM.yyyy') : null
}
