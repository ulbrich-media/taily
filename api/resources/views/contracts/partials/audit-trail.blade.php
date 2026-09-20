<h2>Prüfprotokoll</h2>
<p class="muted">
    Zertifikat über den Abschluss der elektronischen Signatur. Die folgenden Ereignisse wurden
    während des Signaturvorgangs automatisch protokolliert. Alle Zeitangaben sind in UTC.
    Jede Zeile nennt die Person, die das Ereignis betrifft; IP-Adresse und Browser werden nur
    dort ausgewiesen, wo das Ereignis von dieser Person selbst ausgelöst wurde.
</p>

{{--
    Four columns, two of which carry two lines: a name over its email, an IP
    over the browser it belongs to. Each pair is one fact about one party, so
    splitting them into columns of their own bought nothing and cost the page
    the width the values needed. The heading row stacks the same way, which is
    what says which line beneath is which.
--}}
<table class="list-table audit-table">
    <tr>
        <td class="head nowrap">Zeitpunkt</td>
        <td class="head">Ereignis</td>
        <td class="head">Person<br /><span class="sub">E-Mail</span></td>
        <td class="head">IP-Adresse<br /><span class="sub">Browser</span></td>
    </tr>
    {{--
        Every cell below asks the event who the row is about rather than
        reading a column directly: an invite email names the signer it went
        to but carries the IP of the session that sent it, and pairing those
        two in one row would read as the signer having done something. See
        ContractSigningEventType::subject() and ::origin().
    --}}
    @foreach($auditEvents as $event)
        <tr>
            <td class="nowrap">{{ $event->occurred_at->format('d.m.Y, H:i:s') }}</td>
            <td>{{ $event->event_type->label() }}</td>
            <td>
                {{ $event->subjectName() ?? '—' }}
                @if($event->subjectEmail())
                    <br /><span class="muted break">{{ $event->subjectEmail() }}</span>
                @endif
            </td>
            <td>
                {{ $event->originIpAddress() ?? '—' }}
                @if($event->originDevice())
                    <br /><span class="muted">{{ $event->originDevice() }}</span>
                @endif
            </td>
        </tr>
    @endforeach
</table>
