# Taily Laravel Backend

## Setup

Make sure you have Docker and DDEV installed
1. Start the containers with `ddev start`
2. Install dependencies with `ddev composer install`
3. Initialize the database with `ddev artisan migrate:fresh --seed`
4. (optional) Generate helpers for your IDE `ddev composer ide-helper`

## Development

```bash
ddev start                         # Start the environment
ddev artisan ...                   # Run artisan commands
ddev composer ...                  # Run composer commands
ddev composer ide-helper           # generate helper files for the IDE 
ddev artisan migrate:fresh --seed  # Reset database and fill with seed data and default password
ddev artisan migrate:freh          # Reset database 
ddev artisan app:seed --password=<some-password> # seed the database and set the given password for the users
ddev exec api/vendor/bin/psalm --taint-analysis # run psalm analysis
ddev exec api/vendor/bin/psalm --set-baseline=psalm-baseline.xml # set new psalm baseline
```
