<x-mail::message>
# Passwort zurücksetzen

Für dein Konto wurde ein neues Passwort angefordert.

Klicke auf den Button, um ein neues Passwort festzulegen:

<x-mail::button :url="$resetUrl">
Neues Passwort festlegen
</x-mail::button>

Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:

{{ $resetUrl }}

Der Link läuft in {{ $expiresInMinutes }} Minuten ab.

Hast du kein neues Passwort angefordert? Dann kannst du diese E-Mail einfach ignorieren – dein Passwort bleibt unverändert.

Viele Grüße
dein Taily-Team
</x-mail::message>
