<div style="page-break-before: always;">
    <h2>Prüfprotokoll</h2>
    <p class="muted">
        Zertifikat über den Abschluss der elektronischen Signatur. Die folgenden Ereignisse wurden
        während des Signaturvorgangs automatisch protokolliert. Alle Zeitangaben sind in UTC.
    </p>

    <table>
        <tr>
            <td class="label">Zeitpunkt</td>
            <td class="label">Ereignis</td>
            <td class="label">Person</td>
            <td class="label">E-Mail</td>
            <td class="label">IP-Adresse</td>
        </tr>
        @foreach($auditEvents as $event)
            <tr>
                <td>{{ $event->occurred_at->format('d.m.Y, H:i:s') }}</td>
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
                        ?? '—' }}
                </td>
                <td>
                    {{ $event->metadata['person_email']
                        ?? $event->metadata['actor_email']
                        ?? $event->signer?->person?->email
                        ?? '—' }}
                </td>
                <td>{{ $event->ip_address ?: '—' }}</td>
            </tr>
        @endforeach
    </table>
</div>
