<x-mail::message>
# Willkommen bei Taily

Du wurdest eingeladen, Taily beizutreten.

Klicke auf den Button, um dein Konto zu aktivieren und dein Passwort festzulegen.

<x-mail::button :url="$invitationUrl">
Einladung annehmen
</x-mail::button>

Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:

{{ $invitationUrl }}

Der Link läuft am {{ $expiresAt->format('d.m.Y') }} um {{ $expiresAt->format('H:i') }} Uhr ab.

Wenn du diese Einladung nicht erwartet hast, kannst du diese E-Mail einfach ignorieren.

Viele Grüße
dein Taily-Team
</x-mail::message>
