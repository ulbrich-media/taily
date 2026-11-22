<x-mail::message>
# Deine Bewerbungen

Mit diesem Link siehst du, wie es mit deinen Bewerbungen weitergeht, und kannst deine Angaben ergänzen.

<x-mail::button :url="$url">
Zu meinen Bewerbungen
</x-mail::button>

Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:

<x-mail::code>{{ $url }}</x-mail::code>

Der Link ist {{ $hours }} Stunden gültig und kann einmal verwendet werden. Wenn du ihn nicht angefordert hast, kannst du diese E-Mail einfach ignorieren.
</x-mail::message>
