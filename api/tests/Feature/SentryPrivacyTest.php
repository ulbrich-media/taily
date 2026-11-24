<?php

namespace Taily\Tests\Feature;

use Sentry\DataCollection\DataCollectionPolicy;
use Sentry\Options;
use Taily\Providers\TailyServiceProvider;
use Taily\Support\SentryScrubber;
use Taily\Tests\TestCase;

class SentryPrivacyTest extends TestCase
{
    public function test_limits_what_the_sdk_collects(): void
    {
        config([
            'sentry.data_collection' => null,
            'sentry.before_send' => null,
            'sentry.before_send_transaction' => null,
            'sentry.before_breadcrumb' => null,
        ]);

        (new TailyServiceProvider($this->app))->register();

        $this->assertSame([SentryScrubber::class, 'beforeSend'], config('sentry.before_send'));
        $this->assertSame([SentryScrubber::class, 'beforeSend'], config('sentry.before_send_transaction'));
        $this->assertSame([SentryScrubber::class, 'beforeBreadcrumb'], config('sentry.before_breadcrumb'));

        // The SDK accepts the values and applies them.
        $options = new Options([
            'data_collection' => config('sentry.data_collection'),
            'before_send' => config('sentry.before_send'),
            'before_send_transaction' => config('sentry.before_send_transaction'),
            'before_breadcrumb' => config('sentry.before_breadcrumb'),
        ]);
        $policy = DataCollectionPolicy::fromOptions($options);
        $collection = $policy->getDataCollection();

        $this->assertNotNull($collection);
        $this->assertFalse($policy->shouldCollectUserInfo());
        $this->assertSame([], $collection->getHttpBodies());
        $this->assertFalse($collection->shouldCollectDatabaseQueryData());
        $this->assertSame('off', $collection->getCookies()->getMode());
        $this->assertSame('off', $collection->getUrlQueryParams()->getMode());
    }

    public function test_keeps_options_the_operator_configured(): void
    {
        $own = [self::class, 'ownBeforeSend'];
        config(['sentry.before_send' => $own, 'sentry.data_collection' => ['user_info' => true]]);

        (new TailyServiceProvider($this->app))->register();

        $this->assertSame($own, config('sentry.before_send'));
        $this->assertSame(['user_info' => true], config('sentry.data_collection'));
    }
}
