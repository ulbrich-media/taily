<?php

namespace Taily\Tests\Feature;

use Illuminate\Console\Scheduling\Event;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Routing\Router;
use Laravel\Sanctum\Http\Middleware\CheckAbilities;
use Laravel\Sanctum\Http\Middleware\CheckForAnyAbility;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Taily\Http\Middleware\SetReferrerPolicyHeader;
use Taily\Tests\TestCase;

/**
 * Installs boot from the taily-app scaffold's bootstrap/app.php, which
 * `composer update` never touches. Everything the package needs at boot must
 * therefore come from TailyServiceProvider — these tests pin that down.
 */
class PackageWiringTest extends TestCase
{
    public function test_scheduled_tasks_are_registered_by_the_package(): void
    {
        $events = collect($this->app->make(Schedule::class)->events())
            ->mapWithKeys(fn (Event $event) => [
                trim(substr($event->command, strpos($event->command, 'artisan') + strlen('artisan')), " '\"") => $event->expression,
            ]);

        $this->assertSame('0 0 * * *', $events['contracts:process-reminders'] ?? null);
        $this->assertSame('*/5 * * * *', $events['tiervermittlung:sync'] ?? null);
        $this->assertSame('30 3 * * *', $events['tiervermittlung:reconcile'] ?? null);
    }

    public function test_sanctum_ability_aliases_are_registered_by_the_package(): void
    {
        $aliases = $this->app->make(Router::class)->getMiddleware();

        $this->assertSame(CheckAbilities::class, $aliases['ability'] ?? null);
        $this->assertSame(CheckForAnyAbility::class, $aliases['abilities'] ?? null);
    }

    public function test_api_group_middleware_is_registered_by_the_package(): void
    {
        $api = $this->app->make(Kernel::class)->getMiddlewareGroups()['api'];

        $this->assertSame(EnsureFrontendRequestsAreStateful::class, $api[0]);
        $this->assertContains(SetReferrerPolicyHeader::class, $api);
    }
}
