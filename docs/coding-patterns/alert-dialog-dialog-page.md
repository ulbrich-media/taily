# AlertDialog vs. Dialog vs. Page

## Overview

Three UI containers are available for user interactions: `AlertDialog`, `Dialog`, and a full `Page`. Choosing the right one keeps the UI consistent and prevents dialogs that require scrolling or pages that feel too heavy for a simple confirmation.

## Decision Rules

**Use `AlertDialog` when:**
- Asking the user to confirm a destructive or irreversible action
- The interaction requires at most one small additional field (e.g. a reason text field, a date picker)

**Use `Dialog` when:**
- Presenting a short form or compact content
- All fields fit on screen without scrolling

**Use a `Page` when:**
- The form or content is long enough that the user would need to scroll inside a dialog
- The interaction warrants its own URL and navigation context

The general rule is: **if a dialog would scroll, use a page instead.**

## Example Implementations

- **AlertDialog** (no extra fields): `src/admin/module/api-tokens/pages/ApiTokenDeletePage.tsx`
- **AlertDialog** (one extra field): `src/admin/module/adoptions/pages/AdoptionCancelPage.tsx`
- **Dialog** (short form): `src/admin/module/medical-tests/pages/MedicalTestCreatePage.tsx`
- **Page** (long form): `src/admin/module/adoptions/pages/AdoptionCreatePage.tsx`
