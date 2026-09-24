<x-mail::message>
# Signaturvorgang abgelaufen

Hallo {{ $recipientName }},

@if($expiredSignerIsMediator)
der Link zur Unterschrift des Schutzvertrags für **{{ $animalName }}** ist abgelaufen, da er nicht rechtzeitig von dir unterschrieben wurde.
@else
der Link zur Unterschrift des Schutzvertrags für **{{ $animalName }}** ist abgelaufen, da er nicht rechtzeitig vom/von der Adoptant:in unterschrieben wurde.
@endif

Der Signaturvorgang wurde automatisch beendet. Du kannst einen neuen Vorgang starten oder den Vertrag manuell klären.

<x-mail::button :url="$adoptionUrl">
Vermittlung öffnen
</x-mail::button>
</x-mail::message>
