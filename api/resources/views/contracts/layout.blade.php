{{--
    The frame every contract document shares: page geometry, the header and
    footer bands, and the base typography and table styling. A document
    supplies nothing but its own name and content:

        @extends('taily::contracts.layout')
        @section('title', 'Schutzvertrag')
        @push('styles') ...only this document needs... @endpush
        @section('content') ...the document itself... @endsection

    The title is rendered in three places at once — the PDF's <title>, the
    header band's right-hand corner, and the document's opening <h1> — so a
    document names itself once.

    This is also the one file an installation edits to brand its documents:
    the logo in the header and the organisation details in the footer are
    written here and every document rendered through the layout picks them
    up, the contract body and the signature appendix included. Override it
    by placing a copy at resources/views/vendor/taily/contracts/layout.blade.php
    (see ADR-013); Laravel resolves that path ahead of the package's own.
--}}
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>@yield('title')</title>
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
        .muted {
            color: #555;
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
        .page-header .brand-logo {
            max-height: 28px;
            margin-top: 6px;
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
        @stack('styles')
    </style>
</head>
<body>
    <div class="page-header">
        {{--
            Replace the word mark with the installation's own logo, e.g.
            <img class="brand-logo" src="{{ public_path('images/contract-logo.png') }}" alt="…">
            dompdf reads local files below base_path(), so a file anywhere in
            the app — public/, storage/ — works; remote URLs do not.
        --}}
        <span class="brand">Taily</span>
        <span class="doc-title">@yield('title')</span>
    </div>

    {{--
        Static on purpose: the frame has to render identically for every
        document, including the signature appendix, which knows nothing
        about an adoption's organisation. Write the operating organisation's
        details here once.
    --}}
    <div class="page-footer">
        <div class="org-info">
            Taily Tierschutz<br>
            Musterstraße 1, 12345 Musterstadt<br>
            kontakt@taily.example · +49 30 1234567
        </div>
    </div>

    <h1>@yield('title')</h1>

    @yield('content')
</body>
</html>
