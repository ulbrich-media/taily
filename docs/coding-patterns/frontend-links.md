# Frontend Links via Callback

The frontend exposes a single `/callback` route that dispatches to the correct page based on an `action` query parameter. All backend-generated frontend links must go through [`FrontendUriBuilder`](../../api/app/Support/FrontendUriBuilder.php) — never construct frontend URLs inline.

```
/callback?action=<action>&token=<token>
```

The base URL is read from `config('app.frontend_url')` → env `FRONTEND_URL`.

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

---

## Rules

- **Never** call `env('FRONTEND_URL', ...)` or build callback URLs inline — all callers break silently if the URL structure changes.
- **Never** pass a token that may be expired or consumed. Validate before calling the builder (e.g. check `isExpired()`, or use `activeToken()` in resources).
- Add new callback actions as needed.
