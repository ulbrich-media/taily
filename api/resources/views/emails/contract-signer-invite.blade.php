<x-mail::message>
# Schutzvertrag zur Unterschrift

Hallo {{ $recipientName }},

@if($isMediator)
für die Vermittlung von **{{ $animalName }}** liegt ein Schutzvertrag zur Unterschrift bereit.
@else
der/die Vermittler:in hat den Schutzvertrag für **{{ $animalName }}** bereits unterschrieben. Jetzt bist du an der Reihe.
@endif

Klicke auf den Button, um den Vertrag zu prüfen und zu unterschreiben:

<x-mail::button :url="$signUrl">
Vertrag prüfen und unterschreiben
</x-mail::button>

Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:

<x-mail::code>{{ $signUrl }}</x-mail::code>

Die Unterschrift kann über diesen Link nur einmal abgegeben werden.
</x-mail::message>
