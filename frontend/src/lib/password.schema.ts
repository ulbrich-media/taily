import { z } from 'zod'

export const passwordFieldSchema = z
  .string()
  .min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein')
  .regex(/[A-Za-z]/, 'Das Passwort muss mindestens einen Buchstaben enthalten')
  .regex(/[0-9]/, 'Das Passwort muss mindestens eine Zahl enthalten')

export const passwordConfirmationSchema = z
  .object({
    password: passwordFieldSchema,
    password_confirmation: z.string().min(1, 'Bitte bestätige dein Passwort'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Die Passwörter stimmen nicht überein',
    path: ['password_confirmation'],
  })

export function withPasswordConfirmation<T extends z.ZodRawShape>(
  extraShape: T
) {
  return z.object(extraShape).and(passwordConfirmationSchema)
}
