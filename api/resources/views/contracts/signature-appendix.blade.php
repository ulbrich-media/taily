@extends('taily::contracts.layout')

@section('title', 'Unterschriften')

@push('styles')
        .signature-name {
            font-family: 'DejaVu Serif', serif;
            font-style: italic;
        }
        .hash {
            font-family: 'DejaVu Sans Mono', monospace;
            font-size: 9px;
            word-wrap: break-word;
        }
@endpush

@section('content')
    <p class="muted">
        Dieser Anhang gehört untrennbar zu dem vorstehenden Schutzvertrag. Er dokumentiert die
        elektronischen Unterschriften beider Parteien sowie den vollständigen Verlauf des
        Signaturvorgangs. Alle Zeitangaben sind in UTC angegeben.
    </p>

    @foreach([$mediatorSigner, $adopterSigner] as $signer)
        @if($signer?->isSigned())
            <h2>{{ $signer->role->label() }}</h2>
            <table>
                <tr>
                    <td class="label">Eingegebener Name</td>
                    <td class="signature-name">{{ $signer->typed_name }}</td>
                </tr>
                <tr>
                    <td class="label">Unterschrieben am</td>
                    <td>{{ $signer->signed_at->format('d.m.Y, H:i:s') }} UTC</td>
                </tr>
                <tr>
                    <td class="label">Vertragsinhalt akzeptiert</td>
                    <td>{{ $signer->contract_content_accepted ? 'Ja' : 'Nein' }}</td>
                </tr>
                <tr>
                    <td class="label">Datenschutzerklärung akzeptiert</td>
                    <td>{{ $signer->privacy_policy_accepted ? 'Ja' : 'Nein' }}</td>
                </tr>
                <tr>
                    <td class="label">Angaben bestätigt</td>
                    <td>{{ $signer->information_confirmed ? 'Ja' : 'Nein' }}</td>
                </tr>
            </table>
        @endif
    @endforeach

    <h2>Unterzeichnetes Dokument</h2>
    <p class="muted">
        Die vorstehenden Vertragsseiten wurden einmalig erzeugt und beiden Parteien unverändert zur
        Prüfung vorgelegt. Der folgende Prüfwert identifiziert genau dieses Dokument; er wurde bei
        jeder Unterschrift mitprotokolliert.
    </p>
    <table>
        <tr>
            <td class="label">SHA-256 des Vertragsdokuments</td>
            <td class="hash">{{ $process->unsigned_document_hash }}</td>
        </tr>
    </table>
    <p class="muted">
        Das ist der Prüfwert der vorstehenden Vertragsseiten, wie sie von den Vertragspartnern
        gesehen und unterzeichnet wurden. Nach Unterzeichnung wurden nur die Unterschriften und
        das Prüfprotokoll angehangen. Das Gesamtdokument hat einen anderen Prüfwert, welcher zum
        Zeitpunkt der Erstellung noch nicht bekannt war.
    </p>

    @include('taily::contracts.partials.audit-trail', ['auditEvents' => $auditEvents])
@endsection
