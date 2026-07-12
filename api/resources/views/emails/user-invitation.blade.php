<x-mail::message>
# Willkommen bei Taily

Du wurdest eingeladen, Taily beizutreten.

Klicke auf den Button, um dein Konto zu aktivieren und dein Passwort festzulegen.

<x-mail::button :url="$invitationUrl">
Einladung annehmen
</x-mail::button>

Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:

<x-mail::code>{{ $invitationUrl }}</x-mail::code>

Der Link läuft am {{ $expiresAt->format('d.m.Y') }} um {{ $expiresAt->format('H:i') }} Uhr ab.

Wenn du diese Einladung nicht erwartet hast, kannst du diese E-Mail einfach ignorieren.
</x-mail::message>
