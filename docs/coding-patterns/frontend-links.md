# Frontend Links via Callback

The frontend exposes a single `/callback` route that dispatches to the correct page based on an `action` query parameter. All backend-generated frontend links must go through [`FrontendUriBuilder`](../../api/src/Support/FrontendUriBuilder.php) — never construct frontend URLs inline.

```
/callback?action=<action>&token=<token>
```

The base URL is read from `config('taily.frontend_url')` → env `TAILY_FRONTEND_URL` (falls back to `APP_URL`).

---

## Adding a new link

Add a static method to `FrontendUriBuilder` for each new action:

```php
public static function myAction(string $token): string
{
    return static::callback('my_action', $token);
}
```

Then register the corresponding action in the frontend's `/callback` route handler.

Current actions: `inspect`, `contract_sign`, `application_confirm`, `applicant_login`, `user_invite_accepted`, `password_reset`.

### Links without a token

A link that needs no token points straight at its page, still built in `FrontendUriBuilder`:

- `application($animalId)` — the public application form `/apply/{animal}`, copied from the animal's admin page.
- `adoptionDetail($adoptionId)` — the admin adoption page, for emails to mediators who have a login.

---

## Rules

- **Never** call `env('TAILY_FRONTEND_URL', ...)` or build callback URLs inline — all callers break silently if the URL structure changes.
- **Never** pass a token that may be expired or consumed. Validate before calling the builder (e.g. check `isExpired()`, or use `activeToken()` in resources).
- Add new callback actions as needed.
