<x-mail::message>
# Neue E-Mail-Adresse bestätigen

Für dein Taily-Konto wurde eine neue E-Mail-Adresse hinterlegt.

Klicke auf den Button, um die Änderung zu bestätigen:

<x-mail::button :url="$confirmUrl">
E-Mail-Adresse bestätigen
</x-mail::button>

Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:

<x-mail::code>{{ $confirmUrl }}</x-mail::code>

Der Link läuft am {{ $expiresAt->format('d.m.Y') }} um {{ $expiresAt->format('H:i') }} Uhr ab.

Wenn du diese Änderung nicht angefordert hast, kannst du diese E-Mail einfach ignorieren – deine E-Mail-Adresse bleibt unverändert.
</x-mail::message>
