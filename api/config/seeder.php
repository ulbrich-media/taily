<?php

use Database\Seeders\AdoptionSeeder;

return [

    /*
    |--------------------------------------------------------------------------
    | Demo user password
    |--------------------------------------------------------------------------
    |
    | The password the seeded login accounts get. `app:seed --password=` sets
    | this for a single run.
    |
    */

    'password' => env('SEEDER_PASSWORD', 'Test!234'),

    /*
    |--------------------------------------------------------------------------
    | Mail domain
    |--------------------------------------------------------------------------
    |
    | Every seeded address is built from the name it belongs to and put on this
    | domain, so nothing the seeder creates can reach a real inbox.
    |
    */

    'mail_domain' => env('SEEDER_MAIL_DOMAIN', 'local.local'),

    /*
    |--------------------------------------------------------------------------
    | Default profile
    |--------------------------------------------------------------------------
    */

    'default_profile' => env('SEEDER_PROFILE', 'dev'),

    /*
    |--------------------------------------------------------------------------
    | Profiles
    |--------------------------------------------------------------------------
    |
    | How much of what to seed. Pick one with `app:seed --profile=`, and change
    | a single number with `--set=key=value`, e.g.
    |
    |     ddev artisan app:seed --profile=dev --set=adoptions=500
    |
    | Keys:
    |
    |   organizations               external clubs a person can belong to
    |   people                      the people directory, applicants included
    |   animals                     per species key from SpeciesCatalog
    |   adoptions                   how many adoptions to generate
    |   adoption_stages             relative weight of each AdoptionStage
    |   adoptions_per_transport     [min, max] animals sharing one completed
    |                               transport. Every run stays inside those
    |                               bounds; the one exception is having fewer
    |                               adoptions in total than a run holds, which
    |                               leaves a single smaller run
    |   empty_transports            upcoming runs with nothing booked on them
    |   standalone_pre_inspections  inspections without an adoption behind them
    |   media                       percentage of records that get a picture —
    |                               not everything has one in practice, and
    |                               attaching media runs the image conversions
    |                               inline, by far the slowest part of a run
    |
    */

    'profiles' => [

        'minimal' => [
            'label' => 'Just enough to click through the app',
            'organizations' => 2,
            'people' => 5,
            'animals' => ['dogs' => 6, 'cats' => 4],
            'adoptions' => 6,
            'adoption_stages' => AdoptionSeeder::DEFAULT_STAGE_WEIGHTS,
            'adoptions_per_transport' => [4, 15],
            'empty_transports' => 1,
            'standalone_pre_inspections' => 1,
            'media' => ['people' => 20, 'animals' => 80],
        ],

        'dev' => [
            'label' => 'Balanced set for day-to-day development',
            'organizations' => 3,
            'people' => 30,
            'animals' => ['dogs' => 25, 'cats' => 10],
            'adoptions' => 20,
            'adoption_stages' => AdoptionSeeder::DEFAULT_STAGE_WEIGHTS,
            'adoptions_per_transport' => [4, 15],
            'empty_transports' => 2,
            'standalone_pre_inspections' => 4,
            'media' => ['people' => 20, 'animals' => 80],
        ],

        'large' => [
            'label' => 'Load and performance testing; no pictures',
            'organizations' => 25,
            'people' => 2000,
            'animals' => ['dogs' => 3500, 'cats' => 1500],
            'adoptions' => 4000,
            'adoption_stages' => AdoptionSeeder::DEFAULT_STAGE_WEIGHTS,
            'adoptions_per_transport' => [4, 15],
            'empty_transports' => 20,
            'standalone_pre_inspections' => 200,
            'media' => ['people' => 0, 'animals' => 0],
        ],

    ],

];
