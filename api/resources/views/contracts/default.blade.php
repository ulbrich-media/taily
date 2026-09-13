@extends('taily::contracts.layout')

@section('title', 'Schutzvertrag')

@push('styles')
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
@endpush

@section('content')
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
@endsection
