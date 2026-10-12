<x-mail::message>
# Schutzvertrag vollständig unterschrieben

Hallo {{ $recipientName }},

vielen Dank! Der Schutzvertrag für **{{ $animalName }}** wurde nun von beiden Seiten unterschrieben.

Klicke auf den Button, um das unterschriebene Dokument herunterzuladen:

<x-mail::button :url="$downloadUrl">
Vertrag herunterladen
</x-mail::button>

Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:

<x-mail::code>{{ $downloadUrl }}</x-mail::code>

Der Link läuft nach einigen Tagen ab. Bitte lade das Dokument rechtzeitig herunter und bewahre es für deine Unterlagen auf.
</x-mail::message>
