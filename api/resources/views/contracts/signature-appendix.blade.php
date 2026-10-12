@extends('taily::contracts.layout')

@section('title', 'Unterschriften')

@push('styles')
        .signature-name {
            /* The heading face in italic, the closest thing to a hand in a
               document that has no handwriting in it. */
            font-family: 'Fraunces', Georgia, serif;
            font-style: italic;
        }
        .hash {
            font-family: 'DejaVu Sans Mono', monospace;
            font-size: 9px;
            word-wrap: break-word;
        }
        /* The party a section is about, named once directly under its
           heading so that nothing inside the section has to name them
           again. */
        .party {
            margin: -2px 0 10px 0;
        }
        .party-email {
            display: block;
            font-size: 11px;
            color: #6f6f66;
        }

        /* The trail is printed as two table shapes — one per signer, one for
           the process itself — and dompdf's auto layout can place neither:
           it sizes every column from its content, so the email address, the
           one value that can grow without limit, takes the slack and the
           columns holding a timestamp or a browser name get squeezed until
           their contents break mid-value or run off the edge of the sheet.

           Stating the layout as fixed takes the decision away from the
           content: the widths below are the whole specification, and a cell
           that needs more wraps inside its column instead of stealing from
           its neighbours. They live here rather than in the layout because
           they describe these two tables and nothing else — the layout is
           the file an installation rebrands, and column budgets are not
           branding. */
        .audit-table {
            table-layout: fixed;
        }
        /* A fixed column is a hard boundary, and an email address is a single
           long word that can cross it rather than wrap on its own, printing
           over the top of the next column. Breaking one mid-word is the
           lesser evil; at the widths below it only comes up for an address
           with nowhere better to break. */
        .audit-table td {
            word-wrap: break-word;
        }
        /* The quieter half of a stacked cell, so a row reads as one entry
           rather than two — in the heading row as much as in the body. */
        .audit-table span.sub {
            display: block;
            font-size: 10px;
            font-weight: normal;
            color: #6f6f66;
        }
        /* A signer's own events. No column names a person — the section
           heading does — which leaves every value room to sit on one line. */
        .signer-events td.col-time {
            width: 22%;
        }
        .signer-events td.col-event {
            width: 30%;
        }
        .signer-events td.col-ip {
            width: 16%;
        }
        .signer-events td.col-device {
            width: 32%;
        }
        /* The process's own events, carrying one column more: the user who
           triggered them, over their email address. */
        .process-events td.col-time {
            width: 20%;
        }
        .process-events td.col-event {
            width: 22%;
        }
        .process-events td.col-actor {
            width: 28%;
        }
        .process-events td.col-ip {
            width: 12%;
        }
        .process-events td.col-device {
            width: 18%;
        }
@endpush

@section('content')
    <p class="muted">
        Dieser Anhang gehört untrennbar zu dem vorstehenden Schutzvertrag. Er dokumentiert die
        elektronischen Unterschriften beider Parteien sowie den vollständigen Verlauf des
        Signaturvorgangs. Alle Zeitangaben sind in UTC.
    </p>
    <p class="muted">
        Die folgenden Abschnitte führen die Ereignisse getrennt nach den Beteiligten auf: Jeder
        Abschnitt nennt eingangs die Person, um die es geht, und enthält ausschließlich Ereignisse,
        die diese Person betreffen. IP-Adresse und Browser werden dort nur ausgewiesen, wo das
        Ereignis von dieser Person selbst ausgelöst wurde — beim Versand einer E-Mail etwa bleiben
        sie leer, weil dieser vom System vorgenommen wurde.
    </p>

    @foreach($signerSections as $section)
        <h2>{{ $section['signer']->role->label() }}</h2>
        <p class="party">
            {{ $section['name'] }}
            @if($section['email'])
                <span class="party-email">{{ $section['email'] }}</span>
            @endif
        </p>

        @if($section['signer']->isSigned())
            <table class="data-table">
                <tr>
                    <td class="label">Eingegebener Name</td>
                    <td class="signature-name">{{ $section['signer']->typed_name }}</td>
                </tr>
                <tr>
                    <td class="label">Unterschrieben am</td>
                    <td>{{ $section['signer']->signed_at->format('d.m.Y, H:i:s') }} UTC</td>
                </tr>
                <tr>
                    <td class="label">Vertragsinhalt akzeptiert</td>
                    <td>{{ $section['signer']->contract_content_accepted ? 'Ja' : 'Nein' }}</td>
                </tr>
                <tr>
                    <td class="label">Datenschutzerklärung akzeptiert</td>
                    <td>{{ $section['signer']->privacy_policy_accepted ? 'Ja' : 'Nein' }}</td>
                </tr>
                <tr>
                    <td class="label">Angaben bestätigt</td>
                    <td>{{ $section['signer']->information_confirmed ? 'Ja' : 'Nein' }}</td>
                </tr>
            </table>
        @endif

        @include('taily::contracts.partials.signer-events', ['events' => $section['events']])
    @endforeach

    <h2>Verlauf des Vertrags</h2>
    <p class="muted">
        Ereignisse, die den Vertrag insgesamt betreffen und keiner der beiden Parteien
        zuzuordnen sind.
    </p>
    @include('taily::contracts.partials.process-events', ['events' => $processEvents])
@endsection
