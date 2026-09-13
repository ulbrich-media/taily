<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>Schutzvertrag</title>
    <style>
        @page {
            /* Deep enough top and bottom margins for the fixed header and
               footer bands to sit inside them with ~5mm of clearance to the
               sheet edge, which is more than any common printer trims. */
            margin: 76px 40px 80px 40px;
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
        /* dompdf positions fixed boxes against the page's content area, not
           the sheet, so top/bottom 0 would drop the band into the flow's
           first line. The negative offsets lift each band into the @page
           margin it is supposed to live in; left/right 0 already sit on the
           content edges, which is why neither band carries a side padding. */
        .page-header {
            position: fixed;
            top: -58px;
            left: 0;
            right: 0;
            height: 40px;
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
            bottom: -62px;
            left: 0;
            right: 0;
            height: 42px;
            padding-top: 8px;
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
        /* A float would not do here: dompdf lays a width:100% table out
           across the full containing block regardless of floats, so the
           photo would be painted on top of the animal table's last column.
           A two-cell layout table is what actually reserves the column, and
           it keeps the table's right border a clean, unbroken edge. */
        td.media-main,
        td.media-aside {
            border: 0;
            padding: 0;
            background: none;
            vertical-align: top;
        }
        td.media-aside {
            width: 156px;
            padding-left: 16px;
        }
        td.media-main table {
            margin-bottom: 0;
        }
        .animal-photo {
            width: 140px;
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
    <table class="media-layout">
        <tr>
            <td class="media-main">
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
            </td>
            @if($animalPhoto)
                <td class="media-aside">
                    <img class="animal-photo" src="{{ $animalPhoto }}" alt="Foto von {{ $animal->name }}">
                </td>
            @endif
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
