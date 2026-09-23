# Taily Laravel Backend

## Setup

Make sure you have Docker and DDEV installed
1. Start the containers with `ddev start`
2. Install dependencies with `ddev composer install`
3. Initialize the database with `ddev artisan app:seed --fresh`
4. (optional) Generate helpers for your IDE `ddev composer ide-helper`

## Development

```bash
ddev start                         # Start the environment
ddev artisan ...                   # Run artisan commands
ddev composer ...                  # Run composer commands
ddev composer ide-helper           # generate helper files for the IDE 
ddev artisan migrate:fresh         # Reset database
ddev artisan app:seed --fresh      # Reset database and fill it with demo data
ddev exec api/vendor/bin/psalm --taint-analysis # run psalm analysis
ddev exec api/vendor/bin/psalm --set-baseline=psalm-baseline.xml # set new psalm baseline
```

## Seeding

How much of what gets seeded comes from a profile in `config/seeder.php`.

| Profile   | Purpose                                   | People | Animals | Adoptions | Pictures |
|-----------|-------------------------------------------|--------|---------|-----------|----------|
| `minimal` | Just enough to click through the app      | 5      | 10      | 6         | yes      |
| `dev`     | Balanced set for day-to-day development   | 30     | 35      | 20        | yes      |
| `large`   | Load and performance testing              | 2000   | 5000    | 4000      | no       |

```bash
ddev artisan app:seed --list                            # show the profiles
ddev artisan app:seed --fresh                           # the default profile (dev)
ddev artisan app:seed --profile=large --fresh           # load-test set, ~15s
ddev artisan app:seed --set=adoptions=500               # one value changed
ddev artisan app:seed --set=media.animals=0             # nested values work too
ddev artisan app:seed --seed=1234 --fresh               # reproducible run
ddev artisan app:seed --password=<some-password>        # password for the demo users
```

Log in as `admin@local.local` or `user@local.local`; the password defaults to
`Test!234`. Every other seeded address is derived from the name it belongs to
(`lena.mueller@local.local`) and sits on a domain that cannot receive mail.

`media` in a profile is the percentage of records that get a picture — 20% of
people and 80% of animals by default, since a shelter photographs nearly every
animal it lists while most people in the directory are just contact details.
Raise it with `--set=media.animals=100`, and note that attaching pictures is
the slowest part of a run.

`--seed` pins the random source so a run can be repeated. Attaching pictures
draws randomness from the image conversions, which the seeder does not control,
so add `--set=media.people=0 --set=media.animals=0` for an identical run — the
`large` profile has them off already.
