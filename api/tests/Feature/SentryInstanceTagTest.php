<?php

namespace Taily\Tests\Feature;

use Taily\Providers\TailyServiceProvider;
use Taily\Tests\TestCase;

class SentryInstanceTagTest extends TestCase
{
    public function test_adds_the_instance_to_the_sentry_default_tags(): void
    {
        config([
            'taily.sentry.instance' => 'verein-a',
            'sentry.tags' => ['team' => 'ops'],
        ]);

        (new TailyServiceProvider($this->app))->register();

        $this->assertSame(['team' => 'ops', 'instance' => 'verein-a'], config('sentry.tags'));
    }

    public function test_sets_no_tag_without_an_instance(): void
    {
        config(['taily.sentry.instance' => '', 'sentry.tags' => []]);

        (new TailyServiceProvider($this->app))->register();

        $this->assertSame([], config('sentry.tags'));
    }
}
