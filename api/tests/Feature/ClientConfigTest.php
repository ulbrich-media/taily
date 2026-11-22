<?php

namespace Taily\Tests\Feature;

use Taily\Tests\TestCase;

class ClientConfigTest extends TestCase
{
    public function test_sentry_is_null_without_a_frontend_dsn(): void
    {
        config(['taily.sentry.frontend_dsn' => '']);

        $this->getJson('/internal/client-config')
            ->assertOk()
            ->assertExactJson(['sentry' => null]);
    }

    public function test_returns_the_frontend_sentry_config_without_authentication(): void
    {
        config([
            'taily.sentry.frontend_dsn' => 'https://key@o1.ingest.sentry.io/2',
            'taily.sentry.frontend_traces_sample_rate' => 0.1,
            'taily.sentry.frontend_replays_session_sample_rate' => 0.0,
            'taily.sentry.frontend_replays_on_error_sample_rate' => 1.0,
            'taily.sentry.environment' => 'production',
            'taily.sentry.release' => 'v1.2.3',
            'taily.sentry.instance' => 'verein-a',
        ]);

        $this->getJson('/internal/client-config')
            ->assertOk()
            ->assertExactJson([
                'sentry' => [
                    'dsn' => 'https://key@o1.ingest.sentry.io/2',
                    'environment' => 'production',
                    'release' => 'v1.2.3',
                    'instance' => 'verein-a',
                    'traces_sample_rate' => 0.1,
                    'replays_session_sample_rate' => 0.0,
                    'replays_on_error_sample_rate' => 1.0,
                ],
            ]);
    }

    public function test_environment_defaults_to_the_app_environment(): void
    {
        config(['taily.sentry.frontend_dsn' => 'https://key@o1.ingest.sentry.io/2']);

        $this->getJson('/internal/client-config')
            ->assertOk()
            ->assertJsonPath('sentry.environment', 'testing');
    }
}
