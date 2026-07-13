<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
<title>{{ config('app.name') }}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>
@media only screen and (max-width: 600px) {
.inner-body {
width: 100% !important;
}

.footer {
width: 100% !important;
}
}

@media only screen and (max-width: 500px) {
.button {
width: 100% !important;
}
}

/*
 * Dark mode. The theme CSS file (themes/taily.css) is inlined into
 * element style="" attributes by CssToInlineStyles, which strips @media
 * blocks before doing so — so dark-mode overrides have to live in this
 * literal <style> tag instead, which survives untouched in the output.
 * Picked up by clients that honour `prefers-color-scheme` and still
 * render a <style> block (Apple/iOS Mail, Outlook desktop 2019+, most
 * modern webmail); everything else keeps the light styles above, which
 * is an acceptable degradation for a text+link notification email.
 */
@media (prefers-color-scheme: dark) {
body,
.wrapper,
.body {
background-color: #0c0c09 !important;
border-color: #0c0c09 !important;
color: #fbfbf9 !important;
}

a {
color: #efb839 !important;
}

h1,
h2,
h3,
.header a {
color: #fbfbf9 !important;
}

.inner-body {
background-color: #1d1d16 !important;
border-color: #2b2b22 !important;
}

.subcopy,
.table th {
border-color: #2b2b22 !important;
}

.subcopy p,
.footer p,
.footer a,
.table td {
color: #abab9c !important;
}

.panel-content,
.panel-content p {
background-color: #2b2b22 !important;
color: #fbfbf9 !important;
}

.button-primary {
background-color: #efb839 !important;
border-color: #efb839 !important;
color: #2b2a22 !important;
}

.code-box-content {
background-color: #2b2b22 !important;
border-color: #3a3a2e !important;
color: #fbfbf9 !important;
}
}
</style>
{!! $head ?? '' !!}
</head>
<body>

<table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td align="center">
<table class="content" width="100%" cellpadding="0" cellspacing="0" role="presentation">
{!! $header ?? '' !!}

<!-- Email Body -->
<tr>
<td class="body" width="100%" cellpadding="0" cellspacing="0" style="border: hidden !important;">
<table class="inner-body" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
<!-- Body content -->
<tr>
<td class="content-cell">
{!! Illuminate\Mail\Markdown::parse($slot) !!}

{!! $subcopy ?? '' !!}
</td>
</tr>
</table>
</td>
</tr>

{!! $footer ?? '' !!}
</table>
</td>
</tr>
</table>
</body>
</html>
