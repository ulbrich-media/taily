<?php

namespace Taily\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Laravel\Passkeys\Passkeys;
use RuntimeException;
use Taily\Models\User;
use Throwable;

class SmokeTestAuthConfig extends Command
{
    protected $signature = 'taily:smoke-test-auth';

    /**
     * Verifies auth/passkey config that only resolves correctly once Taily
     * is installed as a Composer dependency: several packages (laravel/
     * fortify, laravel/passkeys) read config keys Taily sets at runtime
     * during their own boot(), and a host app with no config/auth.php or
     * config/cors.php of its own silently falls back to Laravel's generic
     * framework defaults wherever Taily forgets to set one explicitly. That
     * never surfaces in local development, where a full config/auth.php
     * already provides the right values before any provider boots.
     */
    protected $description = 'Verify auth/passkey config resolves correctly to catch package-boundary issues invisible in local development';

    public function handle(): int
    {
        /** @var array<string, callable(): void> $checks */
        $checks = [
            'Passkeys user model points at Taily\Models\User' => function (): void {
                if (Passkeys::userModel() !== User::class) {
                    throw new RuntimeException(sprintf(
                        'Expected %s, got %s',
                        User::class,
                        Passkeys::userModel(),
                    ));
                }
            },
            'Passkey::user() relation resolves without error' => function (): void {
                DB::beginTransaction();

                try {
                    $user = User::factory()->create([
                        'name' => 'Smoke Test',
                        'email' => 'smoke-test-auth@example.com',
                    ]);

                    $passkey = $user->passkeys()->create([
                        'name' => 'smoke-test',
                        'credential_id' => base64_encode(random_bytes(16)),
                        'credential' => ['type' => 'fake'],
                    ]);

                    $owner = $passkey->user;

                    if (! $owner instanceof User || ! $owner->is($user)) {
                        throw new RuntimeException('Passkey::user() did not resolve back to the owning user.');
                    }
                } finally {
                    DB::rollBack();
                }
            },
            'Passkey allowed origins are not a bare wildcard' => function (): void {
                $origins = Passkeys::allowedOrigins();

                if (in_array('*', $origins, true)) {
                    throw new RuntimeException('allowed_origins contains a literal "*" — check config(\'taily.cors_allowed_origins\') is being read, not config(\'cors.allowed_origins\').');
                }

                $frontendUrl = config('taily.frontend_url');

                if ($frontendUrl && ! in_array($frontendUrl, $origins, true)) {
                    throw new RuntimeException("allowed_origins does not contain the configured frontend URL ({$frontendUrl}).");
                }
            },
        ];

        $hasFailures = false;

        foreach ($checks as $name => $check) {
            try {
                $check();
                $this->info("PASS  {$name}");
            } catch (Throwable $e) {
                $hasFailures = true;
                $this->error("FAIL  {$name}: {$e->getMessage()}");
            }
        }

        return $hasFailures ? self::FAILURE : self::SUCCESS;
    }
}
