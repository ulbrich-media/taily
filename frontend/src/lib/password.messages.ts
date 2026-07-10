// The API has no German translation strings, so it returns the raw Laravel
// translation keys (e.g. "validation.current_password" or "passwords.token")
// as the error text. This maps the keys used by the password-related
// endpoints (change, forgot, reset) to proper German messages.
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

// Error keys returned by the password reset endpoints. The API deliberately
// answers link requests generically and reports every failed reset as an
// invalid token, so it never reveals whether an email has an account.
const passwordResetMessages: Record<string, string> = {
  'validation.email': 'Bitte gib eine gültige E-Mail Adresse ein.',
  'passwords.token':
    'Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an.',
}

export function mapPasswordResetMessage(rawMessage: string): string {
  return passwordResetMessages[rawMessage] ?? rawMessage
}

// Error keys returned by the login endpoint.
const authMessages: Record<string, string> = {
  'auth.failed': 'Ungültige Anmeldedaten. Bitte versuche es erneut.',
  'auth.throttle':
    'Zu viele Anmeldeversuche. Bitte warte einen Moment und versuche es erneut.',
}

export function mapAuthMessage(rawMessage: string): string {
  return authMessages[rawMessage] ?? rawMessage
}
