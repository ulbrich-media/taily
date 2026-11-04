<x-mail::message>
# Hallo {{ $name }},

vielen Dank für deine Bewerbung für **{{ $animalName }}**!

Bitte bestätige deine E-Mail-Adresse, damit wir deine Bewerbung bearbeiten können. Danach siehst du jederzeit, wie es mit deiner Bewerbung weitergeht, und kannst deine Angaben ergänzen.

<x-mail::button :url="$url">
Bewerbung bestätigen
</x-mail::button>

Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:

<x-mail::code>{{ $url }}</x-mail::code>

Der Link ist {{ $hours }} Stunden gültig und kann einmal verwendet werden. Wenn du dich nicht beworben hast, kannst du diese E-Mail einfach ignorieren.
</x-mail::message>
