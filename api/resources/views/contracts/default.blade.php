<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>Schutzvertrag</title>
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
        .signatures {
            margin-top: 48px;
            width: 100%;
        }
        .signatures td {
            border: none;
            padding-top: 48px;
            width: 50%;
        }
        .signature-line {
            border-top: 1px solid #1a1a1a;
            padding-top: 4px;
        }
    </style>
</head>
<body>
    <h1>Schutzvertrag</h1>
    <p style="color: #b91c1c; font-style: italic;">
        Hinweis: Dies ist eine Beispielvorlage zu Demonstrationszwecken und kein
        rechtssicherer, produktionsreifer Vertrag. Vor dem Einsatz muss sie durch
        eine eigene, rechtlich geprüfte Fassung ersetzt werden.
    </p>
    <p>
        Dieser Schutzvertrag wird geschlossen zwischen {{ $organization->name ?? 'der Organisation' }}
        (vertreten durch {{ $mediator->full_name ?? 'den Vermittler' }}) und
        {{ $applicant->full_name }} ("Adoptant:in").
    </p>

    <h2>Tier</h2>
    <table>
        <tr>
            <td class="label">Name</td>
            <td>{{ $animal->name }}</td>
        </tr>
        <tr>
            <td class="label">Tierart</td>
            <td>{{ $animal->animalType->title ?? '' }}</td>
        </tr>
        <tr>
            <td class="label">Rasse</td>
            <td>{{ $animal->breed }}</td>
        </tr>
        <tr>
            <td class="label">Tiernummer</td>
            <td>{{ $animal->animal_number }}</td>
        </tr>
    </table>

    <h2>Adoptant:in</h2>
    <table>
        <tr>
            <td class="label">Name</td>
            <td>{{ $applicant->full_name }}</td>
        </tr>
        <tr>
            <td class="label">Anschrift</td>
            <td>
                {{ $applicant->street_line }}{{ $applicant->street_line_additional ? ', '.$applicant->street_line_additional : '' }}<br>
                {{ $applicant->postal_code }} {{ $applicant->city }}
            </td>
        </tr>
        <tr>
            <td class="label">E-Mail</td>
            <td>{{ $applicant->email }}</td>
        </tr>
        <tr>
            <td class="label">Telefon</td>
            <td>{{ $applicant->phone ?: $applicant->mobile }}</td>
        </tr>
    </table>

    <h2>Vermittler:in</h2>
    <table>
        <tr>
            <td class="label">Name</td>
            <td>{{ $mediator->full_name ?? '' }}</td>
        </tr>
        <tr>
            <td class="label">Organisation</td>
            <td>{{ $organization->name ?? '' }}</td>
        </tr>
    </table>

    <h2>Bedingungen</h2>
    <p>
        Der/die Adoptant:in verpflichtet sich, das oben genannte Tier artgerecht zu halten, zu
        pflegen und tierärztlich zu versorgen. Eine Weitergabe an Dritte sowie eine gewerbliche
        Nutzung des Tieres sind ohne vorherige schriftliche Zustimmung der vermittelnden
        Organisation untersagt. Bei Zuwiderhandlung gegen diesen Vertrag behält sich die
        vermittelnde Organisation das Recht vor, das Tier zurückzufordern.
    </p>

    <table class="signatures">
        <tr>
            <td>
                <div class="signature-line">
                    Ort, Datum, Unterschrift Vermittler:in
                </div>
            </td>
            <td>
                <div class="signature-line">
                    Ort, Datum, Unterschrift Adoptant:in
                </div>
            </td>
        </tr>
    </table>

    {{--
        Nothing signature- or audit-related is rendered here. This document is
        generated once, before anyone has signed, and its pages are carried
        into the final artifact unchanged; the typed signatures and the audit
        trail are appended afterwards as their own pages by
        ContractPdfService::appendSignaturePages(). See ADR-013.
    --}}
</body>
</html>
