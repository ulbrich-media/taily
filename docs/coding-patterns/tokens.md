# Token Patterns

Two patterns exist for token-based access depending on whether the token is a gate to an existing record or the record itself.

---

## `HasAccessToken` trait

**Use when** a model needs a public, expiring link that grants temporary access to an existing record.

Tokens are stored in the shared `access_tokens` table (polymorphic). No token columns are added to the model's own table.

**Real-world example:** [`PreInspection`](../../api/app/Models/PreInspection.php) — an admin creates an inspection record, then issues a link so an inspector can submit their verdict via [`PreInspectionSubmissionController`](../../api/app/Http/Controllers/PreInspectionSubmissionController.php).

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
| `issueToken(CarbonInterface $expiresAt)` | Generates a 64-char token, persists it to `access_tokens`. Expiration is mandatory.               |
| `accessTokens()`                         | `morphMany` relation to `AccessToken`.                                                            |
| `whereHasValidToken(string $token)`      | Base query: token exists and has not expired. Extend with consumed conditions in `findByToken()`. |

The `AccessToken` model itself provides `findValid(string $token)` for lookups that start from the token side rather than the owning model.

### Expiration

Always pass an explicit expiration — the method signature enforces it. Choose a duration based on the use case. There is no hashing; the 64-char token entropy and short lifetime make it unnecessary for single-use workflow links.

---

## Self-contained token 

**Use when** the token record *is* the business object — it has its own meaningful state, lifecycle, and relations independent of any other model.

**Real-world example:** [`UserInvitation`](../../api/app/Models/UserInvitation.php) owns its `token` and `expires_at` columns directly. The invitation has no meaning without the token; there is no pre-existing record being gated.

This pattern keeps everything in one table, one model, and one `findByToken()` query with no joins.

---

## Choosing between the two

|                                                | `HasAccessToken` trait       | Self-contained    |
|------------------------------------------------|------------------------------|-------------------|
| The token gates access to an existing record   | yes                          | no                |
| The record IS the token (e.g. an invitation)   | no                           | yes               |
| The model has unique consumed/valid conditions | yes — add to `findByToken()` | yes — own columns |
