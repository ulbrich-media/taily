<h2>Prüfprotokoll</h2>
<p class="muted">
    Zertifikat über den Abschluss der elektronischen Signatur. Die folgenden Ereignisse wurden
    während des Signaturvorgangs automatisch protokolliert. Alle Zeitangaben sind in UTC.
    Bei Ereignissen, die das System selbst ausgelöst hat, bleiben IP-Adresse und Browser leer.
</p>

<table class="list-table audit-table">
    <tr>
        <td class="head nowrap">Zeitpunkt</td>
        <td class="head">Ereignis</td>
        <td class="head">Person, E-Mail</td>
        <td class="head nowrap">IP-Adresse, Browser</td>
    </tr>
    @foreach($auditEvents as $event)
        <tr>
            <td class="nowrap">{{ $event->occurred_at->format('d.m.Y, H:i:s') }}</td>
            <td>{{ $event->event_type->label() }}</td>
            {{--
                Falls back through the signer snapshot, then the acting
                user's snapshot, then a live lookup: internally triggered
                events (cancel, finalize) have no signer but do record who
                performed them, and used to render as "—" here.
            --}}
            <td>
                {{ $event->metadata['person_name']
                    ?? $event->metadata['actor_name']
                    ?? $event->signer?->person?->full_name
                    ?? '—' }} <br />
                {{ $event->metadata['person_email']
                    ?? $event->metadata['actor_email']
                    ?? $event->signer?->person?->email
                    ?? '—' }}
            </td>
            <td class="nowrap">{{ $event->ip_address ?: '—' }}<br />{{ $event->deviceSummary() }}</td>
        </tr>
    @endforeach
</table>
