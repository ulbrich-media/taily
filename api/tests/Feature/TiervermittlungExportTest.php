<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Sleep;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\Person;
use Taily\Models\TiervermittlungListing;
use Taily\Support\Tiervermittlung\AnimalPayloadMapper;
use Taily\Tests\TestCase;

class TiervermittlungExportTest extends TestCase
{
    use RefreshDatabase;

    private const BASE = 'https://www.tiervermittlung.de/api/v1';

    private AnimalType $dogs;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('animal-pictures');
        Sleep::fake();
        Http::preventStrayRequests();

        config([
            'taily.tiervermittlung.enabled' => true,
            'taily.tiervermittlung.api_key' => 'tv_test_key',
            'taily.tiervermittlung.base_url' => self::BASE,
            'taily.tiervermittlung.location' => ['country' => 'DE', 'zip' => '04109', 'city' => 'Leipzig'],
            'taily.tiervermittlung.request_interval_ms' => 0,
            'taily.tiervermittlung.max_requests_per_run' => 50,
        ]);

        $this->dogs = AnimalType::create(['title' => 'Hund', 'tiervermittlung_species' => 'dog']);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function animal(string $name = 'Bello', array $attributes = []): Animal
    {
        $animal = Animal::create(array_merge([
            'animal_type_id' => $this->dogs->id,
            'name' => $name,
            'gender' => 'male',
            'current_country' => 'DE',
            'do_publish' => true,
            'publish_description' => "{$name} ist ein freundlicher Hund, der ein Zuhause sucht.",
        ], $attributes));
        $animal->addMedia(UploadedFile::fake()->image('bild.jpg', 40, 30))->toMediaCollection('pictures');

        return $animal;
    }

    private function fakePublished(): void
    {
        Http::fake([
            self::BASE.'/tiere/*' => fn (Request $request) => $request->method() === 'DELETE'
                ? Http::response(['tierId' => 'x', 'status' => 'entfernt'])
                : Http::response([
                    'tierId' => basename(parse_url($request->url(), PHP_URL_PATH)),
                    'status' => 'veroeffentlicht',
                    'aenderung' => 'neu',
                    'tvId' => 2962437,
                    'url' => 'https://www.tiervermittlung.de/cgi-bin/haustier/details.pl?IDin=2962437',
                    'warnungen' => ['Rasse nicht erkannt'],
                ], 201),
        ]);
    }

    private function sync(): void
    {
        $this->artisan('tiervermittlung:sync')->assertSuccessful();
    }

    public function test_a_new_animal_is_sent_and_its_listing_stored(): void
    {
        $this->fakePublished();
        $animal = $this->animal();

        $this->sync();

        Http::assertSent(fn (Request $request) => $request->method() === 'PUT'
            && $request->url() === self::BASE.'/tiere/'.$animal->animal_number
            && $request->hasHeader('Authorization', 'Bearer tv_test_key')
            && $request['name'] === 'Bello'
            && $request['species'] === 'dog');

        $listing = $animal->tiervermittlungListing()->first();
        $this->assertSame('veroeffentlicht', $listing->status);
        $this->assertSame(2962437, $listing->tv_id);
        $this->assertSame(['Rasse nicht erkannt'], $listing->warnings);
        $this->assertNotNull($listing->last_sent_at);
    }

    public function test_an_unchanged_animal_is_not_sent_again(): void
    {
        $this->fakePublished();
        $this->animal();

        $this->sync();
        $this->sync();

        Http::assertSentCount(1);
    }

    public function test_a_changed_animal_is_sent_again(): void
    {
        $this->fakePublished();
        $animal = $this->animal();

        $this->sync();
        $animal->update(['is_reserved' => true]);
        $this->sync();

        Http::assertSentCount(2);
        Http::assertSent(fn (Request $request) => $request->method() === 'PUT' && $request['reserved'] === true);
    }

    public function test_an_unchanged_animal_is_refreshed_before_its_listing_expires(): void
    {
        $this->fakePublished();
        $this->animal();

        $this->sync();
        $this->travel(31)->days();
        $this->sync();

        Http::assertSentCount(2);
    }

    public function test_an_adopted_animal_is_removed_as_placed(): void
    {
        $this->fakePublished();
        $animal = $this->animal();
        $this->sync();

        $applicant = Person::create(['first_name' => 'Anna', 'last_name' => 'Adopter', 'email' => 'anna@example.com']);
        Adoption::create(['animal_id' => $animal->id, 'applicant_id' => $applicant->id, 'status' => 'done']);
        $this->sync();

        Http::assertSent(fn (Request $request) => $request->method() === 'DELETE'
            && $request->url() === self::BASE.'/tiere/'.$animal->animal_number.'?grund=vermittelt');
        $this->assertDatabaseCount('tiervermittlung_listings', 0);
    }

    public function test_an_unpublished_animal_is_removed(): void
    {
        $this->fakePublished();
        $animal = $this->animal();
        $this->sync();

        $animal->update(['do_publish' => false]);
        $this->sync();

        Http::assertSent(fn (Request $request) => $request->method() === 'DELETE'
            && str_ends_with($request->url(), '?grund=entfernt'));
        $this->assertDatabaseCount('tiervermittlung_listings', 0);
    }

    public function test_the_listing_of_a_deleted_animal_is_removed(): void
    {
        $this->fakePublished();
        $animal = $this->animal();
        $this->sync();

        $animal->delete();
        $this->sync();

        Http::assertSent(fn (Request $request) => $request->method() === 'DELETE'
            && $request->url() === self::BASE.'/tiere/'.$animal->animal_number.'?grund=entfernt');
        $this->assertDatabaseCount('tiervermittlung_listings', 0);
    }

    public function test_a_listing_already_gone_on_the_platform_is_forgotten(): void
    {
        $animal = $this->animal('Bello', ['do_publish' => false]);
        TiervermittlungListing::create(['animal_id' => $animal->id, 'tier_id' => $animal->animal_number, 'status' => 'veroeffentlicht']);
        Http::fake([self::BASE.'/tiere/*' => Http::response(['fehler' => 'Unbekannte Tiernummer'], 404)]);

        $this->sync();

        $this->assertDatabaseCount('tiervermittlung_listings', 0);
    }

    public function test_a_listing_keyed_by_the_uuid_is_deleted_and_sent_again_under_the_number(): void
    {
        $this->fakePublished();
        $animal = $this->animal();
        $listing = TiervermittlungListing::create(['animal_id' => $animal->id, 'tier_id' => $animal->id, 'status' => 'veroeffentlicht', 'tv_id' => 1, 'payload_hash' => 'old']);

        $this->sync();

        Http::assertSent(fn (Request $request) => $request->method() === 'DELETE'
            && $request->url() === self::BASE.'/tiere/'.$animal->id.'?grund=entfernt');
        Http::assertSent(fn (Request $request) => $request->method() === 'PUT'
            && $request->url() === self::BASE.'/tiere/'.$animal->animal_number);
        $listing->refresh();
        $this->assertSame($animal->animal_number, $listing->tier_id);
        $this->assertSame(2962437, $listing->tv_id);
    }

    public function test_a_failed_delete_keeps_the_old_listing_and_is_retried(): void
    {
        $animal = $this->animal();
        $listing = TiervermittlungListing::create(['animal_id' => $animal->id, 'tier_id' => $animal->id, 'status' => 'veroeffentlicht']);
        Http::fake([self::BASE.'/tiere/*' => Http::response(['fehler' => 'Fehler'], 500)]);

        $this->artisan('tiervermittlung:sync')->assertFailed();

        $this->assertSame($animal->id, $listing->fresh()->tier_id);
        Http::assertNotSent(fn (Request $request) => $request->method() === 'PUT');
    }

    public function test_a_delete_answered_with_404_still_re_keys(): void
    {
        $animal = $this->animal();
        $listing = TiervermittlungListing::create(['animal_id' => $animal->id, 'tier_id' => $animal->id, 'status' => 'veroeffentlicht']);
        Http::fake([self::BASE.'/tiere/*' => fn (Request $request) => $request->method() === 'DELETE'
            ? Http::response(['fehler' => 'Unbekannt'], 404)
            : Http::response(['status' => 'veroeffentlicht', 'tvId' => 5, 'url' => 'https://example.test/5'], 201)]);

        $this->sync();

        $this->assertSame($animal->animal_number, $listing->fresh()->tier_id);
    }

    public function test_an_animal_with_a_number_the_platform_would_not_accept_is_not_exported(): void
    {
        $this->fakePublished();
        $animal = $this->animal('Bello', ['animal_number' => 'Tier 1 ä']);

        $this->sync();

        Http::assertNothingSent();
        $this->assertNotEmpty(app(AnimalPayloadMapper::class)->exclusionReasons($animal));
    }

    public function test_animals_that_are_not_exportable_are_never_sent(): void
    {
        $this->fakePublished();
        $unmapped = AnimalType::create(['title' => 'Alpaka']);
        $this->animal('Ohne Freigabe', ['do_publish' => false]);
        $this->animal('Ohne Text', ['publish_description' => '']);
        $this->animal('Alpaka', ['animal_type_id' => $unmapped->id]);
        Animal::create([
            'animal_type_id' => $this->dogs->id, 'name' => 'Ohne Bild', 'gender' => 'male',
            'do_publish' => true, 'publish_description' => 'Text', 'current_country' => 'DE',
        ]);
        $this->animal('Ohne Land', ['current_country' => '']);

        $this->sync();

        Http::assertNothingSent();
    }

    public function test_a_rejected_animal_is_not_sent_again_until_it_changes(): void
    {
        Http::fake([self::BASE.'/tiere/*' => Http::response(['fehler' => 'Beschreibung zu kurz', 'feld' => 'description'], 400)]);
        $animal = $this->animal();

        $this->artisan('tiervermittlung:sync')->assertFailed();
        $this->artisan('tiervermittlung:sync')->assertSuccessful();

        Http::assertSentCount(1);
        $listing = $animal->tiervermittlungListing()->first();
        $this->assertSame(TiervermittlungListing::STATUS_REJECTED, $listing->status);
        $this->assertSame('Beschreibung zu kurz (Feld: description)', $listing->last_error);

        $animal->update(['publish_description' => 'Ein deutlich längerer Beschreibungstext für Bello, jetzt mit Details.']);
        $this->artisan('tiervermittlung:sync');

        Http::assertSentCount(2);
    }

    public function test_an_unchanged_rejected_animal_is_not_resent_by_the_refresh(): void
    {
        Http::fake([self::BASE.'/tiere/*' => Http::response(['fehler' => 'Beschreibung zu kurz', 'feld' => 'description'], 400)]);
        $this->animal();

        $this->artisan('tiervermittlung:sync');
        $this->travel(31)->days();
        $this->artisan('tiervermittlung:sync');

        Http::assertSentCount(1);
    }

    public function test_a_rejected_update_keeps_the_live_listing(): void
    {
        Http::fakeSequence()
            ->push(['status' => 'veroeffentlicht', 'tvId' => 2962437, 'url' => 'https://example.org/2962437'], 201)
            ->push(['fehler' => 'Beschreibung zu kurz', 'feld' => 'description'], 400)
            ->push(['bremse' => false, 'entfernt' => [], 'behalten' => 1, 'unbekannt' => [], 'hinweis' => '']);
        $animal = $this->animal();
        $this->sync();

        $animal->update(['publish_description' => 'Kurz']);
        $this->artisan('tiervermittlung:sync')->assertFailed();

        $listing = $animal->tiervermittlungListing()->first();
        $this->assertSame('veroeffentlicht', $listing->status);
        $this->assertSame(2962437, $listing->tv_id);
        $this->assertSame('Beschreibung zu kurz (Feld: description)', $listing->last_error);

        // Not sent again until it changes ...
        $this->sync();
        Http::assertSentCount(2);

        // ... and still part of the reconciliation, so the platform keeps it.
        $this->artisan('tiervermittlung:reconcile')->assertSuccessful();
        Http::assertSent(fn (Request $request) => $request->url() === self::BASE.'/abgleich'
            && $request['tierIds'] === [$animal->animal_number]);
    }

    public function test_a_temporary_failure_is_retried_on_the_next_run(): void
    {
        Http::fakeSequence()
            ->push(['fehler' => 'Wartung'], 503)
            ->push(['status' => 'veroeffentlicht', 'tvId' => 1, 'url' => 'https://example.org'], 201);
        $animal = $this->animal();

        $this->artisan('tiervermittlung:sync')->assertFailed();
        $this->assertSame('Wartung', $animal->tiervermittlungListing()->first()->last_error);

        $this->sync();

        Http::assertSentCount(2);
        $listing = $animal->tiervermittlungListing()->first();
        $this->assertSame('veroeffentlicht', $listing->status);
        $this->assertSame('', $listing->last_error);
    }

    public function test_it_waits_for_retry_after_when_rate_limited(): void
    {
        Http::fakeSequence()
            ->push(['fehler' => 'Zu viele Anfragen'], 429, ['Retry-After' => '7'])
            ->push(['status' => 'veroeffentlicht', 'tvId' => 1, 'url' => 'https://example.org'], 201);
        $this->animal();

        $this->sync();

        Sleep::assertSlept(fn ($duration) => (int) $duration->totalSeconds === 7);
        Http::assertSentCount(2);
    }

    public function test_an_invalid_key_aborts_the_run(): void
    {
        Http::fake([self::BASE.'/*' => Http::response(['fehler' => 'Schlüssel ungültig'], 401)]);
        $this->animal('Bello');
        $this->animal('Luna');

        $this->artisan('tiervermittlung:sync')->assertFailed();

        Http::assertSentCount(1);
        $this->assertDatabaseCount('tiervermittlung_listings', 0);
    }

    public function test_a_run_stops_at_the_request_limit(): void
    {
        $this->fakePublished();
        config(['taily.tiervermittlung.max_requests_per_run' => 2]);
        $this->animal('Bello');
        $this->animal('Luna');
        $this->animal('Rex');

        $this->sync();
        Http::assertSentCount(2);

        $this->sync();
        Http::assertSentCount(3);
    }

    public function test_it_pauses_between_requests(): void
    {
        $this->fakePublished();
        config(['taily.tiervermittlung.request_interval_ms' => 1100]);
        $this->animal('Bello');
        $this->animal('Luna');

        $this->sync();

        Sleep::assertSleptTimes(1);
    }

    public function test_nothing_happens_while_the_export_is_disabled(): void
    {
        config(['taily.tiervermittlung.enabled' => false]);
        $this->animal();

        $this->artisan('tiervermittlung:sync')->assertSuccessful();
        $this->artisan('tiervermittlung:reconcile')->assertSuccessful();

        Http::assertNothingSent();
    }

    public function test_the_api_key_defaults_to_empty_so_a_missing_key_is_reported(): void
    {
        $config = require __DIR__.'/../../config/taily.php';

        $this->assertSame('', $config['tiervermittlung']['api_key']);
    }

    public function test_an_incomplete_configuration_is_reported(): void
    {
        config(['taily.tiervermittlung.api_key' => '']);

        $this->artisan('tiervermittlung:sync')
            ->expectsOutputToContain('TAILY_TIERVERMITTLUNG_API_KEY')
            ->assertFailed();

        Http::assertNothingSent();
    }

    public function test_a_probe_stores_nothing_and_works_before_the_export_is_enabled(): void
    {
        config(['taily.tiervermittlung.enabled' => false]);
        Http::fake([self::BASE.'/tiere/*' => Http::response([
            'probe' => true,
            'status' => 'wuerde_veroeffentlicht',
            'gruende' => [],
            'bilder' => 1,
            'warnungen' => ['Rasse nicht erkannt'],
        ])]);
        $animal = $this->animal();
        $this->animal('Ohne Text', ['publish_description' => '']);

        $this->artisan('tiervermittlung:sync --probe')
            ->expectsOutputToContain('Status: wuerde_veroeffentlicht')
            ->expectsOutputToContain('Hinweis: Rasse nicht erkannt')
            ->expectsOutputToContain('Ohne Text')
            ->assertSuccessful();

        Http::assertSentCount(1);
        Http::assertSent(fn (Request $request) => $request->url() === self::BASE.'/tiere/'.$animal->animal_number.'?probe=1');
        $this->assertDatabaseCount('tiervermittlung_listings', 0);
    }

    public function test_a_probe_with_errors_fails(): void
    {
        Http::fake([self::BASE.'/tiere/*' => Http::response(['fehler' => 'Beschreibung zu kurz', 'feld' => 'description'], 400)]);
        $this->animal();

        $this->artisan('tiervermittlung:sync --probe')
            ->expectsOutputToContain('Fehler: Beschreibung zu kurz (Feld: description)')
            ->assertFailed();
    }

    public function test_a_probe_is_capped_like_a_sync(): void
    {
        Http::fake([self::BASE.'/tiere/*' => Http::response(['probe' => true, 'status' => 'wuerde_veroeffentlicht'])]);
        config(['taily.tiervermittlung.max_requests_per_run' => 2]);
        $this->animal('Bello');
        $this->animal('Luna');
        $this->animal('Rex');

        $this->artisan('tiervermittlung:sync --probe')->assertSuccessful();
        Http::assertSentCount(2);

        $this->artisan('tiervermittlung:sync --probe --limit=3')->assertSuccessful();
        Http::assertSentCount(5);
    }

    public function test_sync_skips_while_another_export_run_holds_the_lock(): void
    {
        $this->fakePublished();
        $this->animal();
        $lock = Cache::lock('tiervermittlung-export', 60);
        $lock->get();

        $this->artisan('tiervermittlung:sync')
            ->expectsOutputToContain('noch aktiv')
            ->assertSuccessful();
        Http::assertNothingSent();

        $lock->release();
        $this->sync();
        Http::assertSentCount(1);
    }

    public function test_reconcile_waits_for_a_running_sync_and_gives_up_eventually(): void
    {
        Sleep::fake(syncWithCarbon: true);
        $this->fakePublished();
        $this->animal();
        $this->sync();
        Cache::lock('tiervermittlung-export', 3600)->get();

        $this->artisan('tiervermittlung:reconcile')
            ->expectsOutputToContain('übersprungen')
            ->assertFailed();

        Http::assertNotSent(fn (Request $request) => str_ends_with($request->url(), '/abgleich'));
    }

    public function test_reconcile_sends_all_listed_animals_and_resends_unknown_ones(): void
    {
        $this->fakePublished();
        $bello = $this->animal('Bello');
        $luna = $this->animal('Luna');
        $this->sync();

        Http::fake([self::BASE.'/abgleich' => Http::response([
            'bremse' => false, 'entfernt' => ['ALT-1'], 'behalten' => 1, 'unbekannt' => [$luna->animal_number], 'hinweis' => '',
        ])]);

        $this->artisan('tiervermittlung:reconcile')->assertSuccessful();

        Http::assertSent(fn (Request $request) => $request->url() === self::BASE.'/abgleich'
            && collect($request['tierIds'])->sort()->values()->all() === collect([$bello->animal_number, $luna->animal_number])->sort()->values()->all());
        $this->assertSame('', $luna->tiervermittlungListing()->first()->payload_hash);
        $this->assertNotSame('', $bello->tiervermittlungListing()->first()->payload_hash);
    }

    public function test_reconcile_never_sends_an_empty_list(): void
    {
        Http::fake();

        $this->artisan('tiervermittlung:reconcile')->assertSuccessful();

        Http::assertNothingSent();
    }

    public function test_check_reports_the_account(): void
    {
        Http::fake([self::BASE.'/konto' => Http::response(['name' => 'Tierhilfe Leipzig e.V.'])]);

        $this->artisan('tiervermittlung:check')
            ->expectsOutputToContain('Tierhilfe Leipzig e.V.')
            ->assertSuccessful();
    }
}
