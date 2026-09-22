{{--
    The events about the signing process itself rather than about either
    party: it being started, and its completion. Every row here was either
    performed by a signed-in user or by nothing at all, which is why this is
    the one table that can carry a person column honestly — "Ausgelöst von"
    is answered from the acting user alone, never from whoever else the
    event mentions.
--}}
<table class="list-table audit-table process-events">
    <tr>
        <td class="head nowrap col-time">Zeitpunkt</td>
        <td class="head col-event">Ereignis</td>
        <td class="head col-actor">Ausgelöst von<span class="sub">E-Mail</span></td>
        <td class="head nowrap col-ip">IP-Adresse</td>
        <td class="head col-device">Browser</td>
    </tr>
    @foreach($events as $event)
        <tr>
            <td class="nowrap">{{ $event->occurred_at->format('d.m.Y, H:i:s') }}</td>
            <td>{{ $event->event_type->label() }}</td>
            <td>
                {{ $event->triggeredByName() ?? '—' }}
                @if($event->triggeredByEmail())
                    <span class="sub">{{ $event->triggeredByEmail() }}</span>
                @endif
            </td>
            <td class="nowrap">{{ $event->originIpAddress() ?? '—' }}</td>
            <td>{{ $event->originDevice() ?? '—' }}</td>
        </tr>
    @endforeach
</table>
