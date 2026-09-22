{{--
    One signer's own events, inside the section their name heads. There is
    no column naming a person here and there does not need to be: everything
    in this table happened to, or was done by, the party named above it, so
    an IP address in it can only be theirs. That is the whole reason the
    trail is split into sections rather than printed as one table — see
    ContractSigningEventType::subject().
--}}
<table class="list-table audit-table signer-events">
    <tr>
        <td class="head nowrap col-time">Zeitpunkt</td>
        <td class="head col-event">Ereignis</td>
        <td class="head nowrap col-ip">IP-Adresse</td>
        <td class="head col-device">Browser</td>
    </tr>
    @foreach($events as $event)
        <tr>
            <td class="nowrap">{{ $event->occurred_at->format('d.m.Y, H:i:s') }}</td>
            <td>{{ $event->event_type->label() }}</td>
            {{--
                Empty on the invite: it was sent by the system, so its
                recorded origin is the sending session's and not this
                signer's. Printing it here would read as them having done
                something. See ContractSigningEventType::origin().
            --}}
            <td class="nowrap">{{ $event->originIpAddress() ?? '—' }}</td>
            <td>{{ $event->originDevice() ?? '—' }}</td>
        </tr>
    @endforeach
</table>
