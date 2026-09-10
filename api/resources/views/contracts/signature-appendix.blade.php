<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>Unterschriften und Prüfprotokoll</title>
    <style>
        body {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 12px;
            color: #1a1a1a;
        }
        h1 {
            font-size: 20px;
            margin-bottom: 4px;
        }
        h2 {
            font-size: 14px;
            margin-top: 24px;
            margin-bottom: 8px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 4px;
        }
        p {
            line-height: 1.5;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }
        table td {
            padding: 4px 8px;
            border: 1px solid #ccc;
            vertical-align: top;
        }
        table td.label {
            width: 35%;
            font-weight: bold;
            background: #f5f5f5;
        }
        .signature-name {
            font-family: 'DejaVu Serif', serif;
            font-style: italic;
            font-size: 18px;
        }
        .hash {
            font-family: 'DejaVu Sans Mono', monospace;
            font-size: 9px;
            word-wrap: break-word;
        }
        .muted {
            color: #555;
        }
    </style>
</head>
<body>
    <h1>Unterschriften</h1>
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

    @include('taily::contracts.partials.audit-trail', ['auditEvents' => $auditEvents])
</body>
</html>
