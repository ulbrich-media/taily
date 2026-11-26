# Website URL callback

Websites that import animals through the public API can report the live page URL of an animal back to Taily, so staff can copy it (e.g. for social media) without searching the website.

- Endpoint: `PUT /api/animals/{animal}/website-url` with `{ "website_url": "https://..." | null }`. `null` clears the URL.
- Guarded by the token ability `animals:write:website-url`, which can be granted to an API key on its own.
- Validation: `http`/`https` URLs only, max 2048 characters.
- Only published animals (`do_publish = true`) can be updated; others return 404. The stored URL is kept when an animal is unpublished; the website clears it explicitly.
- Stored in `animals.website_url` and exposed in the public animal resource and the internal animal resources. The admin shows it read-only: the animal menu offers "Link auf der Website kopieren" when it is set.
- One URL per animal, i.e. one website per installation. Link shortening is out of scope. The URL is output-only and never fetched server-side.

See `api/public/openapi.yaml` for the contract.
