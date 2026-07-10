// The API has no German translation strings for validation messages, so it
// returns the raw Laravel translation keys (e.g. "validation.current_password")
// as the error text. This maps the keys used by the change-password form's
// validation rules (see UpdatePasswordRequest) to proper German messages.
const passwordValidationMessages: Record<string, string> = {
  'validation.current_password': 'Das aktuelle Passwort ist nicht korrekt.',
  'validation.required': 'Dieses Feld ist erforderlich.',
  'validation.confirmed': 'Die Passwörter stimmen nicht überein.',
  'validation.min.string': 'Das Passwort muss mindestens 8 Zeichen lang sein.',
  'validation.password.letters':
    'Das Passwort muss mindestens einen Buchstaben enthalten.',
  'validation.password.numbers':
    'Das Passwort muss mindestens eine Zahl enthalten.',
  'validation.password.uncompromised':
    'Dieses Passwort wurde in einem Datenleck gefunden. Bitte wähle ein anderes Passwort.',
}

export function mapPasswordValidationMessage(rawMessage: string): string {
  return passwordValidationMessages[rawMessage] ?? rawMessage
}
