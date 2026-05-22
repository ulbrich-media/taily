# Media URLs

Two URL patterns exist for serving uploaded files. Choose based on whether the content is private (internal users only) or intentionally public (embeddable, cacheable).

---

## Signed temporary URLs — private / internal data

**Use when** the file should only be accessible to authenticated internal users (e.g. person pictures, contracts, unpublished animal photos).

URLs are generated via [`MediaUrlGenerator`](../../api/src/Support/MediaUrlGenerator.php), which calls `URL::temporarySignedRoute()`. [`MediaController`](../../api/src/Http/Controllers/Internal/MediaController.php) validates the signature on every request and aborts with 403 if it is missing or expired.

**Key properties:**
- The signature IS the credential — no additional database authorization check is needed per request. This keeps media serving stateless and efficient (important for list views that load many thumbnails at once).
- URLs expire after 1 hour. Data containing a URL will not be considered up-to-date for longer than 1 hour, ensuring fresh URLs are generated before expiry.
- Expiry limits the window if a URL leaks (e.g. captured in a log).

**How to generate a URL:**

```php
// In a Resource — returns a pre-signed URL valid for 1 hour
$media->getTemporaryUrl(now()->addHour(), 'preview');  // specific conversion
$media->getTemporaryUrl(now()->addHour());              // original file
```

**Route:** defined as `media.serve` in `api/routes/internal.php`.

---

## Direct UUID access — public / published data

**Use when** the file is intentionally public and needs to be embeddable in external websites or cached by browsers and CDNs (e.g. published animal pictures on adoption pages).

[`PublicMediaController`](../../api/src/Http/Controllers/Api/PublicMediaController.php) requires no signature. Authorization is enforced at the model level: only `Animal` media where `do_publish === true` is served; all other requests return 404 (deliberately identical response for non-animal and unpublished to avoid leaking UUID existence).

**Key properties:**
- Responses carry `Cache-Control: public, max-age=604800` (1 week). Safe because each upload gets a new UUID, making the URL→content mapping immutable.
- URL non-guessability (UUID v4 entropy) is the only access barrier, which is sufficient for data that is already publicly intended.

**Route:** defined in `api/routes/api.php`, served at `/api/media/{uuid}`.

---

## Choosing between the two

| | Signed temporary URL | Direct UUID access |
|---|---|---|
| Data is private / internal | yes | no |
| Data is publicly published | no | yes |
| Embeddable / CDN-cacheable | no | yes |
| Expires automatically | yes (1 h) | no (immutable by UUID) |
| Requires auth middleware | yes (signature) | no (model-level gate) |

**Do not unify the two patterns.** Requiring signatures on public media breaks CDN caching and external embedding. Removing signatures from private media exposes sensitive data.
