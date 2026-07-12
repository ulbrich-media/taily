# ADR-010: Transactional Email Styling via Laravel Markdown Mail

## Status

Accepted

## Context

Taily currently sends two transactional emails — `UserInvitationMail` and `PasswordResetMail` — each rendered from its own standalone Blade view (`resources/views/emails/*.blade.php`) containing a full `<html>` document with inline styles hardcoded per file. Both templates were copy-pasted from each other and never updated after the product was renamed from its earlier "dog adoption manager" placeholder: subjects and headings still say "Adoption Manager", the tone is formal ("Sie"), and the colors (`#3490dc` button, `#2c3e50` heading, `#e74c3c` warning) have no relationship to the frontend's actual brand palette. Every new transactional email would mean copying one of these files wholesale.

The frontend (React 19, Tailwind v4, shadcn/ui "olive" base) defines its design tokens as CSS custom properties in `frontend/src/index.css`: a gold/amber `--primary` (`#fabf37` light / `#efb839` dark) with a dark `--primary-foreground` (`#2b2a22`), warm-gray neutrals mostly expressed in `oklch()`, and `Public Sans`/`Fraunces` as self-hosted variable fonts. None of that is directly reusable in HTML email: email clients cannot consume CSS custom properties or `oklch()`, and the fonts are npm packages with no CDN URL a `<link>` or `@font-face` could point at. Any email styling therefore has to be a manually maintained, hex/rgb-only re-expression of a subset of those tokens — there is no way to "import" the frontend's theme file as-is.

The deployment constraint is that the API runs on a plain PHP server with no Node build step at request or deploy time, ruling out anything that needs a JS-based compiler (MJML, Tailwind-for-email, `mjml-react`, etc.) unless its output were pre-compiled and committed — which would defeat the goal of content being easy to update, since editing copy would again require a local Node toolchain to regenerate HTML.

Laravel 12 ships a markdown-based mail system (`Illuminate\Mail\Mailables\Content::markdown()`, the `mail::message` Blade component, and `php artisan vendor:publish --tag=laravel-mail`) that was not yet in use in this codebase (no `resources/views/vendor/mail` directory existed). It renders a Blade view containing lightweight Markdown-ish syntax plus a handful of layout components (`mail::message`, `mail::button`, `mail::panel`, `mail::table`) into a shared table-based HTML layout, then CSS-inlines a single theme stylesheet into it at send time using `tijsverkoyen/css-to-inline-styles` — already a transitive dependency of `laravel/framework`'s mail component, so no new package was needed. Table-based layout with inlined styles is the standard approach for maximizing rendering compatibility across Outlook, Gmail, Apple Mail, and other clients that strip `<style>` blocks or ignore modern CSS, and is the same technique tools like MJML compile down to.

## Decision

Use Laravel's built-in markdown mail component system, with a custom theme, instead of hand-rolled per-email HTML or a third-party mail-styling package.

- **Publish and customize the theme, don't hand-roll HTML.** `resources/views/vendor/mail/html/themes/taily.css` replaces the stock `default.css`, re-expressing the frontend's tokens as hex values (oklch neutrals were converted once, by script, and are documented as a comment at the top of the file for future re-conversion if the frontend palette changes): `--primary`/`--primary-foreground` become the button's background/text color (dark text on the light gold background, since the stock theme's white-on-color button text would be unreadable on Taily's gold), `--destructive-text` becomes `.button-red`, and the oklch-derived neutrals become the body background, card background, borders, and muted text. The font stack falls back to the same system-font list Laravel's stock theme already ships (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, ...`) rather than attempting to load `Public Sans`/`Fraunces`, since neither is reachable via a URL and most email clients block remote `@font-face` fetches or strip them entirely; a humanist system-font stack is the closest practical match.
- **`config('mail.markdown.theme')` is set to `taily`.** Both existing Mailables now render via `Content::markdown('taily::emails.*', ...)` instead of `Content::view(...)`, and their Blade views are now just a `mail::message` component with a heading, a couple of lines of body text, and a `mail::button` — a few lines each instead of full HTML documents.
- **Dark mode is supported via `prefers-color-scheme`, applied as a literal `<style>` block in `layout.blade.php`, not in the theme CSS file.** `CssToInlineStyles::convert()` strips `@media` blocks from the CSS it's given before inlining (confirmed by reading `tijsverkoyen/css-to-inline-styles`'s `Processor::cleanCss()`), so a `@media (prefers-color-scheme: dark)` block placed in `themes/taily.css` would be silently dropped and never reach the sent email. The same mechanism Laravel's stock layout already uses for its responsive breakpoints — a literal `<style>` tag in `layout.blade.php`'s `<head>`, which the inliner reads rules *from* but leaves physically untouched in the output — is reused here for the dark-mode overrides. `layout.blade.php`'s `color-scheme`/`supported-color-schemes` meta tags were changed from `light` to `light dark` accordingly.
- **Copy was rewritten in the frontend's voice.** The frontend's UI text (toasts, empty states, confirmation dialogs) consistently uses informal "du" German with short, direct sentences and no corporate boilerplate; both email templates were rewritten to match, and every remaining "Adoption Manager" reference was replaced with "Taily" (subjects, headings, and the footer's `config('app.name')`, which now resolves to `Taily` via `APP_NAME`).

## Consequences

### Positive

- New notification emails (there will be more — the domain is almost entirely "some text plus a link") are now a `mail::message` component with a couple of lines of Markdown/Blade, not a copied HTML document; content changes are plain-language edits, not HTML/CSS edits.
- Styling lives in exactly one file (`themes/taily.css`) plus one `<style>` block for dark mode; updating the brand palette means editing hex values in one place instead of hunting through every email template.
- No Node dependency at any point — `vendor:publish` and CSS inlining are both pure PHP, consistent with the plain-PHP-server constraint.
- Table-based layout with inlined styles is battle-tested across Outlook/Gmail/Apple Mail/webmail clients, which a hand-rolled `<div>`-based layout would not reliably be.
- Dark mode degrades gracefully: clients that don't support `prefers-color-scheme` (or strip `<style>` blocks entirely) simply render the light theme, which was already the only behavior before this change.

### Negative

- The frontend's palette is oklch-based and self-hosted variable fonts; both had to be manually translated to email-safe equivalents (hex colors, system-font fallback) rather than consumed directly, so the two token sets can drift if the frontend theme changes and `themes/taily.css` isn't updated to match — there is no automated sync.
- Dark mode support depends on client behavior Taily doesn't control (`prefers-color-scheme` plus `<style>`-block support); it works in Apple/iOS Mail and recent Outlook desktop but not, for example, the Gmail Android app, which always renders the light theme regardless of device setting.
- Markdown mail's component syntax (`mail::message`, `mail::button`) is a Laravel-specific abstraction with its own quirks (e.g. blank-line-sensitive Markdown parsing inside Blade), a small amount of framework lock-in compared to plain HTML views, though this is the same trade-off any shared layout system would make.

## Alternatives Considered

- **Keep hand-rolled HTML Blade views, just re-skin them**: rejected — it would fix the immediate branding/tone problem but leave every future email a full copy-pasted HTML document with no shared layout, which directly works against the extendability goal.
- **MJML (or another Node-based mail templating compiler)**: rejected outright by the no-Node-at-runtime constraint; pre-compiling MJML output and committing the generated HTML was considered but rejected too, since it would mean content edits require a local Node toolchain to regenerate output, working against the "content should be easy to update" goal.
- **`spatie/laravel-*` or another third-party mail-styling package**: none was installed, and none offers meaningfully more than Laravel's own first-party markdown mail system already provides for this project's needs (simple notification emails); adding one would be an extra dependency for no real gain over what ships with `laravel/framework`.
- **CSS custom properties / `oklch()` directly in the email HTML**: rejected — essentially no email client supports either, so tokens have to be pre-resolved to hex/rgb regardless of which templating approach is chosen.
