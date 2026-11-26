# Tiervermittlung.de Export

Taily pushes the Operating Organization's published animals to [tiervermittlung.de](https://www.tiervermittlung.de) through its Partner-API ([docs](https://www.tiervermittlung.de/api/), [OpenAPI](https://www.tiervermittlung.de/api/v1/openapi.json)). Listings are created, updated and removed automatically; nobody has to maintain them by hand on the platform any more.

The platform is push-only: Taily sends the complete state of each animal, the platform creates or updates the listing. Contact details on the listing always come from the club's account on tiervermittlung.de, never from Taily.

## Setup

1. Ask tiervermittlung.de to enable API access for the club's account (e-mail to webmaster@tiervermittlung.de, subject "API-Zugang").
2. Create a key in the account under "Persönliche Daten" → "API-Schlüssel verwalten". It is shown only once.
3. Configure the installation:

   ```dotenv
   TAILY_TIERVERMITTLUNG_API_KEY=tv_…
   ```

4. Map every Animal Type that should be exported to a species on tiervermittlung.de (Einstellungen → Tierarten → "Tierart auf Tiervermittlung.de").
5. Check the Verträglichkeiten mapping under Einstellungen → Export (see [Compatibility mapping](#compatibility-mapping)). The defaults work without configuration.
6. Check the connection and do a dry run — neither creates anything:

   ```bash
   php artisan tiervermittlung:check
   php artisan tiervermittlung:sync --probe      # -v also prints the listing preview
   ```

7. Switch the export on with `TAILY_TIERVERMITTLUNG_ENABLED=true`.

The export relies on the scheduler cron entry every installation already needs (see [release-architecture.md](../release-architecture.md#scheduled-tasks)). The platform downloads the images from the URLs Taily sends, so `APP_URL` must be publicly reachable — dry runs from a local DDEV instance will report image problems.

### Pictures uploaded before the export existed

The platform only accepts JPEG or PNG, while Taily also takes WebP and GIF uploads. Every animal picture therefore gets an `export` conversion — up to 1440 px, always JPEG — when it is uploaded. Pictures uploaded before this conversion existed need it generated once per installation:

```bash
php artisan media-library:regenerate --only=export --only-missing
```

Until then those pictures are left out of the export (an animal with none left shows "Es gibt kein Bild.").

## Which animals are exported

The same animals the website and the public API show (`do_publish`), minus those that must not be advertised or that the platform would reject:

- not deceased,
- not adopted (no adoption with status `done`),
- Animal Type mapped to a Tiervermittlung Species,
- a description text (`publish_description`),
- at least one picture,
- an Aufenthaltsland (`current_country`).

The Aufenthaltsland was added after the export. When an installation upgrades, animals that already have a listing get `DE`, the country they were listed with until then, so their listings stay online; all other animals start without a country and are only exported once it is set.

Every exported animal is listed as up for adoption (`forAdoption`). The animal's status tab shows whether it is exported, why not, and what the platform answered on the last delivery.

## Data sent

| Platform field | Source |
|---|---|
| `tierId` | the animal number — always set, unique and not editable after creation. Animals whose number has characters outside letters, digits, `-` and `_` are excluded from the export |
| `name`, `breed`, `sex`, `neutered`, `reserved` | same fields on the animal |
| `species` / `speciesDetail` | the Animal Type's Tiervermittlung Species; for `small` and `other` the type's title as detail |
| `birthDate` | `date_of_birth` |
| `heightCm` | `size_cm`, dogs only |
| `title` | `publish_title` — optional, trimmed, at most 60 characters; left out when empty |
| `description` | `publish_description`, followed by the lines `Verträglichkeiten: …` and `Persönlichkeit: …` (comma-separated values, each line only when the animal has any, separated by blank lines). The description text is shortened first, so the lines always fit within 20 000 characters |
| `images` | the first five pictures in their order, as the `export` conversion via the public media route; the media uuid is the image id, so the platform only downloads new pictures |
| `video` | the first MP4 or MOV video of the pictures by order, at most 50 MB, as the original file via the public media route (so `APP_URL` must be publicly reachable); the media uuid is the video id, so a replaced video is downloaded again. Left out when there is none, which makes the platform remove a video sent earlier. The platform converts MP4s in the background, so they appear after a few minutes; problems come back in `warnungen`. YouTube links are not sent |
| `chip` | whether a TASSO or FINDEFIX registration exists — never the numbers |
| `location` | `current_country` as country; for `DE` also `current_postal_code` as `zip` and `current_city` as `city` (trimmed). Abroad only the country is sent |
| `externalUrl` | `application_url`, shown below the description |
| `compatibleWith` | `children` / `dogs` / `cats` set to `true` for every option with a matching Verträglichkeit, see below; left out when nothing matches |

Where an animal lives is recorded as Aufenthaltsland (`current_country`) plus PLZ (`current_postal_code`) and Ort (`current_city`), for example the foster home. The old free-text `current_location` ("Aufenthaltsort (veraltet)") is deprecated and never sent. The platform requires zip and city only for `DE`; abroad the country alone is enough and the listing shows only the country, even when a PLZ/Ort is stored. The platform rejects animals in Germany without zip or city (`400`, "bei country DE sind zip und city Pflicht"), so an animal in Germany without PLZ or Ort is kept out of the export like any other missing requirement; the exclusion reasons name the missing field. The Bundesland is derived by the platform from the zip code, so it is never sent.

Changing PLZ or Ort changes the payload hash, so the listing is corrected on the next sync. Already published animals in Germany without PLZ or Ort are taken off the platform on the next sync and come back once both are filled in. Animals abroad are only published if the club's account has a § 11 TierSchG permit on file; otherwise they come back as `nicht_veroeffentlicht` with a reason. Not sent: health data, chip numbers, people. Compatibilities and personality traits are appended to the description as plain text; compatibilities also feed `compatibleWith`.

### Compatibility mapping

The platform builds its filters (e.g. "verträglich mit Kindern") from `compatibleWith`, which only knows `children`, `dogs` and `cats`. Taily's Verträglichkeiten are free text (`AnimalTrait` with `type = compatibility`), so Einstellungen → Export holds, per option, the words that map to it. Defaults: Kinder → `children`; Hunde, Rüden, Hündinnen → `dogs`; Katzen → `cats`.

A word matches a trait when both are equal after trimming and ignoring case (exact match, no substrings). A word may appear under several options. Only admins can change the mapping; everyone can see it. Changing it changes the payload hash, so affected animals are sent again on the next sync.

**Storage:** a generic key/value table `export_settings` (`key`, JSON `value`) rather than a dedicated mapping table — least code, and later export targets (e.g. FINDEFIX) can add keys without a migration. The mapping lives under `tiervermittlung.compatible_with`; the migration seeds the defaults.

The same page shows the export status (read-only): whether the export is enabled, whether an API key is set (never the key), listings per status, the last successful delivery and the animals that were `abgelehnt` or `nicht_veroeffentlicht`, linked to their status tab. It also lists the animals that are approved for publishing but held back by Taily itself ("Freigegeben, aber nicht exportiert", with the reasons); deceased and adopted animals are left out. The animal sidebar shows a chip on every edit tab: the export status of an exported animal, or "Nicht exportiert" for an approved animal that cannot be exported. There is no chip for unapproved, deceased or adopted animals. Both the list and the chip are hidden (and not sent by the API) while the export is disabled or no API key is set.

## How the sync works

`tiervermittlung:sync` runs every five minutes. Each run builds the payload of every candidate animal and compares its hash with the one stored for the last delivery (`tiervermittlung_listings`), so there is no event wiring — a changed field, a new picture or a completed adoption all show up on the next run.

- **New or changed** animals are sent (`PUT /tiere/{tierId}`).
- A listing whose `tier_id` differs from the animal's current number (listings created when the animal's UUID was the `tierId`) is **re-keyed**: the old listing is deleted on the platform (a 404 counts as deleted; any other failure keeps the old listing and retries next run), then the animal is sent as a new listing. The listing gets a new platform URL and `tvId`, so old links stop working once. Re-keys count towards the per-run limit.
- **Unchanged** animals are sent again after 30 days; the platform lets listings expire after 92 days without a delivery.
- Animals that are **no longer exported** are removed (`DELETE`), with `grund=vermittelt` for adopted animals so they count towards the platform's placement statistics, `entfernt` otherwise. Listings of deleted animals are removed the same way.
- A **rejected** payload (HTTP 400) is kept with the platform's message and only sent again once the animal changes — the 30-day refresh does not resend it either. If the animal was already listed, the listing keeps its status and stays online with the last accepted version. Rate limiting, outages and network errors are retried on the next run. An invalid key aborts the run.
- The platform allows 60 requests per minute: runs pause ~1 s between requests, retry once after `Retry-After`, and stop after 50 animals sent or removed; the rest follows with the next run. Dry runs (`--probe`) have the same cap; `--limit` overrides it.

`tiervermittlung:reconcile` runs daily and hands the platform the full list of listed tier ids (`POST /abgleich`), which removes listings this installation lost track of. Ids the platform does not know are sent again on the next sync. The platform's safety brake keeps it from removing anything if the list looks incomplete. Sync and reconcile share a lock, so the list never misses animals a running sync is just adding: a sync started while another run holds it is skipped, and reconcile waits up to five minutes for it.

## Listing states

| Status | Meaning |
|---|---|
| `veroeffentlicht` | online |
| `nicht_veroeffentlicht` | accepted but not published; the platform's reasons are shown |
| `doppelt` | a listing created by hand for the same animal exists and stays; delete it on the platform to let the exported one appear |
| `abgelehnt` | Taily's own marker: the platform rejected the data before it ever listed the animal |
| empty | not delivered successfully yet |
