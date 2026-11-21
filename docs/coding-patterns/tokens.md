# Token Patterns

Two patterns exist for token-based access depending on whether the token is a gate to an existing record or the record itself.

---

## `HasAccessToken` trait

**Use when** a model needs a public, expiring link that grants temporary access to an existing record.

Tokens are stored in the shared `access_tokens` table (polymorphic). No token columns are added to the model's own table.

**Real-world example:** [`PreInspection`](../../api/src/Models/PreInspection.php) — an admin creates an inspection record, then issues a link so an inspector can submit their verdict via [`PreInspectionSubmissionController`](../../api/src/Http/Controllers/Internal/PreInspectionSubmissionController.php).

### Usage

```php
use App\Traits\HasAccessToken;

class MyModel extends Model
{
    use HasAccessToken;

    // Must be called after save() — the model needs an ID for the morph relation
    public static function create(...): self
    {
        $model = new self([...]);
        $model->save();
        $model->issueToken(now()->addDays(30));
        return $model;
    }

    // Compose the base query with your model's own "consumed" condition
    public static function findByToken(string $token): ?self
    {
        return static::whereHasValidToken($token)
            ->where('status', 'pending')
            ->first();
    }
}
```

### What the trait provides

| Method                                   | Description                                                                                       |
|------------------------------------------|---------------------------------------------------------------------------------------------------|
| `issueToken(CarbonInterface $expiresAt)` | Generates a 64-char token, persists its hash and ciphertext to `access_tokens`. Expiration is mandatory. |
| `accessTokens()`                         | `morphMany` relation to `AccessToken`.                                                            |
| `whereHasValidToken(string $token)`      | Base query: token exists and has not expired. Extend with consumed conditions in `findByToken()`. |

The `AccessToken` model itself provides `findValid(string $token)` for lookups that start from the token side rather than the owning model.

### Expiration

Always pass an explicit expiration — the method signature enforces it. Choose a duration based on the use case.

### Storage

`access_tokens` stores a SHA-256 `token_hash` for the lookup and a `token_ciphertext` (`Crypt::encryptString`) instead of the plaintext, because some flows have to show the same link again later — the pre-inspection's "copy link" action, contract signing reminders. `AccessToken::$token` decrypts it on demand. See [contract.md](../features/contract.md#access-and-security).

---

## Self-contained token 

**Use when** the token record *is* the business object — it has its own meaningful state, lifecycle, and relations independent of any other model.

**Real-world example:** [`UserInvitation`](../../api/src/Models/UserInvitation.php) owns its `token` and `expires_at` columns directly. The invitation has no meaning without the token; there is no pre-existing record being gated.

This pattern keeps everything in one table, one model, and one `findByToken()` query with no joins.

**Second example:** [`ApplicantLink`](../../api/src/Models/ApplicantLink.php) and [`ApplicantSession`](../../api/src/Models/ApplicantSession.php) ([applicant-portal.md](../features/applicant-portal.md)). A link belongs to an email, not to a record — a login link shows every adoption with that email. They store **only the SHA-256 hash** of the token: nothing ever needs the plaintext again, so it is returned once from `issue()` / `open()` and mailed or handed to the browser.

### Links opened by mail scanners

A single-use link in an email must not be consumed by a `GET`. Email security scanners open links automatically and would use them up before the recipient clicks. The link opens a page with a button, and only the button's `POST` consumes the token — see `ApplicantLink::findUsable()` and the frontend's `LinkActionPage`.

---

## Choosing between the two

|                                                | `HasAccessToken` trait       | Self-contained    |
|------------------------------------------------|------------------------------|-------------------|
| The token gates access to an existing record   | yes                          | no                |
| The record IS the token (e.g. an invitation)   | no                           | yes               |
| The model has unique consumed/valid conditions | yes — add to `findByToken()` | yes — own columns |
| The plaintext must be shown again later        | yes — ciphertext is kept     | no — hash only (store a ciphertext if needed) |
