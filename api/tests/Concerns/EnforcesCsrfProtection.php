<?php

namespace Taily\Tests\Concerns;

use Illuminate\Contracts\Encryption\Encrypter;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;

/**
 * Laravel's CSRF middleware unconditionally bypasses itself while
 * app()->runningUnitTests() is true (see VerifyCsrfToken::runningUnitTests()),
 * which is always the case under phpunit — so a feature test can otherwise
 * never observe a 419. This swaps in a subclass that always runs the real
 * check, for the one test per public submit route that proves the
 * protection is actually wired up.
 */
trait EnforcesCsrfProtection
{
    protected function enableCsrfEnforcement(): void
    {
        $this->app->bind(ValidateCsrfToken::class, fn ($app) => new class($app, $app->make(Encrypter::class)) extends ValidateCsrfToken
        {
            protected function runningUnitTests()
            {
                return false;
            }
        });
    }
}
