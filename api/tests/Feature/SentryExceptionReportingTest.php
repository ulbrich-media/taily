<?php

namespace Taily\Tests\Feature;

use Illuminate\Support\Facades\Route;
use RuntimeException;
use Sentry\SentrySdk;
use Sentry\State\Hub;
use Sentry\State\HubInterface;
use Taily\Tests\TestCase;

/**
 * Installs keep their own bootstrap/app.php, which does not call
 * Sentry's Integration::handles(). Taily must register the reporting itself.
 */
class SentryExceptionReportingTest extends TestCase
{
    protected function tearDown(): void
    {
        SentrySdk::setCurrentHub(new Hub);

        parent::tearDown();
    }

    public function test_reports_exceptions_to_sentry_exactly_once(): void
    {
        $exception = new RuntimeException('boom');

        $hub = $this->createMock(HubInterface::class);
        $hub->expects($this->once())
            ->method('captureException')
            ->with($this->identicalTo($exception));
        SentrySdk::setCurrentHub($hub);

        report($exception);
    }

    public function test_reports_an_exception_thrown_in_a_request(): void
    {
        Route::get('/_test/sentry-boom', fn () => throw new RuntimeException('request boom'));

        $hub = $this->createMock(HubInterface::class);
        $hub->expects($this->once())
            ->method('captureException')
            ->with($this->callback(fn ($e) => $e instanceof RuntimeException && $e->getMessage() === 'request boom'));
        SentrySdk::setCurrentHub($hub);

        $this->getJson('/_test/sentry-boom')->assertStatus(500);
    }
}
