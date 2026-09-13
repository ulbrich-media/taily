<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>Schutzvertrag</title>
    <style>
        @page {
            margin: 70px 40px 65px 40px;
        }
        body {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 12px;
            color: #1a1a1a;
            margin: 0;
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
        .page-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 40px;
            padding: 0 40px;
            border-bottom: 1px solid #e0dcc9;
            color: #2b2a22;
        }
        .page-header .brand {
            font-size: 15px;
            font-weight: bold;
            line-height: 40px;
        }
        .page-header .doc-title {
            float: right;
            font-size: 11px;
            line-height: 40px;
            color: #7c7c67;
        }
        .page-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 50px;
            padding: 8px 40px 0 40px;
            border-top: 1px solid #e0dcc9;
            color: #7c7c67;
            font-size: 9px;
            line-height: 1.4;
        }
        .page-footer .org-info {
            /* Leaves room on the right for the page number stamped by
               ContractPdfService::stampPageNumbers() so the two never overlap. */
            max-width: 380px;
        }
        .animal-photo {
            float: right;
            max-width: 140px;
            max-height: 140px;
            margin-left: 12px;
        }
    </style>
</head>
<body>
    <div class="page-header">
        <span class="brand">Taily</span>
        <span class="doc-title">Schutzvertrag</span>
    </div>

    @if($organization)
        <div class="page-footer">
            <div class="org-info">
                {{ $organization->name }}<br>
                {{ $organization->street_line }}{{ $organization->street_line_additional ? ', '.$organization->street_line_additional : '' }}, {{ $organization->postal_code }} {{ $organization->city }}<br>
                {{ $organization->email }}{{ $organization->email && ($organization->phone || $organization->mobile) ? ' · ' : '' }}{{ $organization->phone ?: $organization->mobile }}
            </div>
        </div>
    @endif

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
    @if($animalPhoto)
        <img class="animal-photo" src="{{ $animalPhoto }}" alt="Foto von {{ $animal->name }}">
    @endif
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
            <td class="label">Farbe</td>
            <td>{{ $animal->color }}</td>
        </tr>
        <tr>
            <td class="label">Geburtsdatum</td>
            <td>{{ $animal->date_of_birth?->format('d.m.Y') }}</td>
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
            <td class="label">Geburtsdatum</td>
            <td>{{ $applicant->date_of_birth?->format('d.m.Y') }}</td>
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
</body>
</html>
