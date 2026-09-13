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
@use('Taily\Support\ContractFonts')
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>@yield('title')</title>
    <style>
        /* The application's own typefaces (see frontend/src/index.css):
           Fraunces for headings, Public Sans for everything else. The
           frontend loads them as variable .woff2 from npm, which dompdf can
           read neither of — it takes TrueType from a local path only — so
           static instances of the same families ship in resources/fonts.

           Every weight and style has to be registered explicitly: dompdf
           picks the registered face that matches and never synthesises a
           bold or an italic it has no file for. Keep a stock fallback on
           every font-family below, so a document still renders if a face
           fails to load. */
        @font-face {
            font-family: 'Public Sans';
            font-weight: normal;
            font-style: normal;
            src: url("{{ ContractFonts::path('PublicSans-Regular.ttf') }}") format('truetype');
        }
        @font-face {
            font-family: 'Public Sans';
            font-weight: bold;
            font-style: normal;
            src: url("{{ ContractFonts::path('PublicSans-Bold.ttf') }}") format('truetype');
        }
        @font-face {
            font-family: 'Public Sans';
            font-weight: normal;
            font-style: italic;
            src: url("{{ ContractFonts::path('PublicSans-Italic.ttf') }}") format('truetype');
        }
        @font-face {
            font-family: 'Fraunces';
            font-weight: normal;
            font-style: normal;
            src: url("{{ ContractFonts::path('Fraunces9pt-Regular.ttf') }}") format('truetype');
        }
        @font-face {
            /* The semibold instance carries the bold slot: at heading sizes
               this document works in, Fraunces' actual Bold prints heavy. */
            font-family: 'Fraunces';
            font-weight: bold;
            font-style: normal;
            src: url("{{ ContractFonts::path('Fraunces9pt-SemiBold.ttf') }}") format('truetype');
        }
        @font-face {
            font-family: 'Fraunces';
            font-weight: normal;
            font-style: italic;
            src: url("{{ ContractFonts::path('Fraunces9pt-Italic.ttf') }}") format('truetype');
        }
        @page {
            /* Deep enough top and bottom margins for the fixed header and
               footer bands to sit inside them with ~5mm of clearance to the
               sheet edge, which is more than any common printer trims. */
            margin: 80px 40px;
        }
        body {
            font-family: 'Public Sans', Helvetica, Arial, sans-serif;
            font-size: 12px;
            color: #1d1d16;
            margin: 0;
        }
        h1 {
            font-family: 'Fraunces', Georgia, serif;
            font-weight: bold;
            font-size: 28px;
            margin: 0 0 8px;
        }
        h2 {
            font-weight: bold;
            font-size: 16px;
            margin-top: 16px;
            margin-bottom: 6px;
            border-bottom: 1px solid #e8e8e3;
            padding-bottom: 4px;
        }
        p {
            /* Print spacing, not the browser default's 1em above and below:
               a contract is a dense document and both families set wider
               than the core font this was first drawn in. */
            margin: 0 0 10px 0;
            line-height: 1.3;
        }
        .muted {
            color: #555;
        }
        /* Tables come in kinds, and every rule below hangs off the kind's
           own class — never off `table` or `td` alone. Tables nest here (the
           animal table sits inside the layout table that reserves the
           photo's column), and a bare `table td` rule would reach straight
           through the outer table into the inner one, which is why each kind
           has to leave the others alone rather than undo what they set.

           For the same reason no rule below uses a descendant selector on
           `td`: cells that need styling carry a class of their own. */

        /* Key and value, one pair per row. */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        /* One record per row, under a heading row naming the columns. */
        .list-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        .data-table td,
        .list-table td {
            padding: 4px 8px;
            border-top: 1px solid #e8e8e3;
            vertical-align: top;
            /* Both families carry more built-in leading than the core font
               this document used to be set in, which on a dense table adds
               up to a page. Stating the line height keeps rows compact. */
            line-height: 1.3;
        }
        /* The rules separate rows from each other and nothing more: the
           first row carries no line above it and the last none below, so a
           table reads as part of the page instead of a box drawn on it. */
        .data-table tr:first-child td,
        .list-table tr:first-child td {
            border-top: 0;
        }
        /* `label` is the key cell of a key/value table and claims the width
           that shape needs; `head` names a column in a list table and has to
           keep sizing itself from its content. Both look the same. */
        .data-table td.label,
        .list-table td.head {
            font-weight: bold;
            background: #f4f4f0;
        }
        .data-table td.label {
            width: 220px;
        }
        td.nowrap {
            white-space: nowrap;
        }

        /* Tiny border radius for the colored cells */
        .data-table tr:first-child td.label:first-child {
            border-top-left-radius: 4px;
        }
        .data-table tr:last-child td.label:first-child {
            border-bottom-left-radius: 4px;
        }
        .list-table tr:first-child td.head:first-child {
            border-top-left-radius: 4px;
        }
        .list-table tr:first-child td.head:last-child {
            border-top-right-radius: 4px;
        }

        /* Scaffolding: columns to lay content out side by side, with no
           lines, padding or background of its own. */
        .layout-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        td.layout-main,
        td.layout-aside {
            padding: 0;
            vertical-align: top;
        }
        /* dompdf positions fixed boxes against the page's content area, not
           the sheet, so top/bottom 0 would drop the band into the flow's
           first line. The negative offsets lift each band into the @page
           margin it is supposed to live in; left/right 0 already sit on the
           content edges, which is why neither band carries a side padding. */
        .page-header {
            position: fixed;
            top: -48px;
            left: 0;
            right: 0;
            height: 20px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e8e8e3;
        }
        .page-header .brand {
            font-size: 14px;
            font-weight: bold;
            line-height: 14px;
        }
        .page-header .brand-logo {
            max-height: 28px;
            margin-top: 6px;
        }
        .page-header .doc-title {
            float: right;
            padding-top: 3px;
            font-size: 11px;
            line-height: 11px;
            color: #7c7c67;
        }
        .page-footer {
            position: fixed;
            bottom: -62px;
            left: 0;
            right: 0;
            height: 42px;
            padding-top: 8px;
            border-top: 1px solid #e8e8e3;
            color: #7c7c67;
            font-size: 9px;
            line-height: 1.3;
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
