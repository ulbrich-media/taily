<x-mail::message>
# Erinnerung: Schutzvertrag zur Unterschrift

Hallo {{ $recipientName }},

@if($isMediator)
für die Vermittlung von **{{ $animalName }}** wartet noch immer ein Schutzvertrag auf deine Unterschrift.
@else
der Schutzvertrag für **{{ $animalName }}** wartet noch immer auf deine Unterschrift.
@endif

@if($daysRemaining <= 2)
Der Link läuft in {{ $daysRemaining }} Tagen ab. Bitte unterschreibe zeitnah, sonst wird der Signaturvorgang automatisch beendet.
@else
Der Link läuft in {{ $daysRemaining }} Tagen ab.
@endif

Klicke auf den Button, um den Vertrag zu prüfen und zu unterschreiben:

<x-mail::button :url="$signUrl">
Vertrag prüfen und unterschreiben
</x-mail::button>

Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:

<x-mail::code>{{ $signUrl }}</x-mail::code>

Die Unterschrift kann über diesen Link nur einmal abgegeben werden.
</x-mail::message>
