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
5. Check the connection and do a dry run — neither creates anything:

   ```bash
   php artisan tiervermittlung:check
   php artisan tiervermittlung:sync --probe      # -v also prints the listing preview
   ```

6. Switch the export on with `TAILY_TIERVERMITTLUNG_ENABLED=true`.

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
| `tierId` | the animal's id — permanent, unlike the animal number |
| `name`, `breed`, `sex`, `neutered`, `reserved` | same fields on the animal |
| `species` / `speciesDetail` | the Animal Type's Tiervermittlung Species; for `small` and `other` the type's title as detail |
| `birthDate` | `date_of_birth` |
| `heightCm` | `size_cm`, dogs only |
| `title` | `publish_title` — optional, trimmed, at most 60 characters; left out when empty |
| `description` | `publish_description`, followed by the lines `Verträglichkeiten: …` and `Persönlichkeit: …` (comma-separated values, each line only when the animal has any, separated by blank lines). The description text is shortened first, so the lines always fit within 20 000 characters |
| `images` | the first five pictures in their order, as the `export` conversion via the public media route; the media uuid is the image id, so the platform only downloads new pictures |
| `chip` | whether a TASSO or FINDEFIX registration exists — never the numbers |
| `location` | `current_country` as country; zip and city are always `-` |
| `externalUrl` | `application_url`, shown below the description |

Taily only knows the country an animal lives in (`current_location` is free text for people). The platform requires zip and city too and fills both with a dash when a listing abroad is entered by hand, so the export sends `-` for every animal. Animals abroad are only published if the club's account has a § 11 TierSchG permit on file; otherwise they come back as `nicht_veroeffentlicht` with a reason. Not sent: health data, chip numbers, people.

## How the sync works

`tiervermittlung:sync` runs every five minutes. Each run builds the payload of every candidate animal and compares its hash with the one stored for the last delivery (`tiervermittlung_listings`), so there is no event wiring — a changed field, a new picture or a completed adoption all show up on the next run.

- **New or changed** animals are sent (`PUT /tiere/{tierId}`).
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
