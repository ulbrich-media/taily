{{--
    The one view every configured contract template renders through
    (ADR-017): the template's title, its three data sections as label/value
    tables, then its wording. The sections arrive ready to print — see
    ContractTemplateService::printout() — so this file is layout only.

    An installation that needs something the configuration can't express —
    inline placeholders in the wording, a different arrangement — overrides
    this view at resources/views/vendor/taily/contracts/configured.blade.php
    (see ADR-013).
--}}
@extends('taily::contracts.layout')

@section('title', $template->title)

@push('styles')
        /* A float would not do here: dompdf lays a width:100% table out
           across the full containing block regardless of floats, so the
           photo would be painted on top of the animal table's last column.
           The layout table is what actually reserves the column for it. */
        .layout-table td.layout-aside {
            width: 140px;
            padding-left: 16px;
        }
        .layout-table .data-table {
            margin-bottom: 0;
        }
        .animal-photo {
            width: 150px;
            border-radius: 4px;
        }
@endpush

@php
    $headings = ['animal' => 'Tier', 'mediator' => 'Vermittler:in', 'adopter' => 'Adoptant:in'];
@endphp

@section('content')
    @foreach($headings as $section => $heading)
        @if(! empty($sections[$section]) || ($section === 'animal' && $animalPhoto))
            <h2>{{ $heading }}</h2>
            @php
                $table = view('taily::contracts.partials.data-table', ['rows' => $sections[$section]])->render();
            @endphp
            @if($section === 'animal' && $animalPhoto)
                <table class="layout-table">
                    <tr>
                        <td class="layout-main">{!! $table !!}</td>
                        <td class="layout-aside">
                            <img class="animal-photo" src="{{ $animalPhoto }}" alt="Foto des Tieres">
                        </td>
                    </tr>
                </table>
            @else
                {!! $table !!}
            @endif
        @endif
    @endforeach

    <div class="contract-body">
        {!! $body !!}
    </div>
@endsection
