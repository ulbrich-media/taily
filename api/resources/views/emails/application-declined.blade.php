<x-mail::message>
# Hallo {{ $name }},

vielen Dank für deine Bewerbung für **{{ $animalName }}**. Leider müssen wir dir mitteilen, dass wir deine Bewerbung nicht berücksichtigen können.

@if ($reason !== '')
<x-mail::panel>
{{ $reason }}
</x-mail::panel>

@endif
Wir danken dir für dein Interesse und wünschen dir alles Gute.
</x-mail::message>
