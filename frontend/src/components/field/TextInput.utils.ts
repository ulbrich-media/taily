import { z } from 'zod'

export const STRING_LENGTH_FIELD = 255
export const STRING_LENGTH_TEXTAREA = 65535

export const zFieldInt = () =>
  z
    .string()
    .regex(/^(0|[1-9]\d{0,9})?$/, 'Nur ganze Zahlen erlaubt')
    .nullable()
    .optional()

export const zFieldString = (
  options:
    | {
        maxLength?: number
        required?: boolean
      }
    | undefined = {}
) => {
  const maxLength = options.maxLength ?? STRING_LENGTH_FIELD
  const required = options.required ?? false

  let schema = z
    .string()
    .max(maxLength, `Darf maximal ${maxLength} Zeichen lang sein`)
    .trim()

  if (required) {
    schema = schema.min(1, 'Pflichtfeld darf nicht leer sein')
  }

  return schema
}
