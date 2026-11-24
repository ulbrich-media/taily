<?php

namespace Taily\Tests\Unit;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Sentry\Breadcrumb;
use Sentry\Event;
use Sentry\ExceptionDataBag;
use Sentry\Tracing\Span;
use Taily\Support\SentryScrubber;

class SentryScrubberTest extends TestCase
{
    private const F = SentryScrubber::FILTERED;

    /**
     * @return array<string, array{string, string}>
     */
    public static function tokenUrls(): array
    {
        return [
            'invitation' => ['/internal/invitations/abc123/accept', '/internal/invitations/'.self::F.'/accept'],
            'inspect' => ['https://taily.example/internal/inspect/abc123/submit', 'https://taily.example/internal/inspect/'.self::F.'/submit'],
            'contract' => ['/internal/contracts/abc123/document?x=1', '/internal/contracts/'.self::F.'/document?x=1'],
            'confirm' => ['/internal/apply/confirm/abc123', '/internal/apply/confirm/'.self::F],
            'portal login' => ['/internal/portal/login/abc123', '/internal/portal/login/'.self::F],
            'frontend invitation' => ['/admin/invitation/abc123', '/admin/invitation/'.self::F],
            'route not found message' => ['The route internal/inspect/abc123 could not be found.', 'The route internal/inspect/'.self::F.' could not be found.'],
        ];
    }

    #[DataProvider('tokenUrls')]
    public function test_removes_the_token(string $input, string $expected): void
    {
        $this->assertSame($expected, SentryScrubber::scrub($input));
    }

    /**
     * @return array<string, array{string}>
     */
    public static function untouched(): array
    {
        return [
            'login' => ['/internal/login'],
            'contract template' => ['/admin/settings/contracts/0193-template-id'],
            'route pattern' => ['/internal/contracts/{token}/submit'],
            'animal' => ['/internal/apply/01a204d7-b860-752b-87fe-f5db61bd414d'],
        ];
    }

    #[DataProvider('untouched')]
    public function test_leaves_other_urls_unchanged(string $input): void
    {
        $this->assertSame($input, SentryScrubber::scrub($input));
    }

    public function test_scrubs_an_error_event(): void
    {
        $event = Event::createEvent();
        $event->setRequest(['url' => 'https://taily.example/internal/inspect/abc123', 'method' => 'POST']);
        $event->setTags(['url' => '/internal/inspect/abc123']);
        $event->setMessage('Failed for /internal/contracts/%s', ['abc123'], 'Failed for /internal/contracts/abc123');
        $exception = new ExceptionDataBag(new \RuntimeException('The route internal/inspect/abc123 could not be found.'));
        $event->setExceptions([$exception]);
        $event->setBreadcrumb([
            new Breadcrumb(Breadcrumb::LEVEL_INFO, Breadcrumb::TYPE_HTTP, 'http', 'GET /internal/contracts/abc123', ['url' => '/internal/contracts/abc123']),
        ]);

        $result = SentryScrubber::beforeSend($event);

        $this->assertSame('https://taily.example/internal/inspect/'.self::F, $result->getRequest()['url']);
        $this->assertSame('POST', $result->getRequest()['method']);
        $this->assertSame(['url' => '/internal/inspect/'.self::F], $result->getTags());
        $this->assertSame('Failed for /internal/contracts/'.self::F, $result->getMessageFormatted());
        $this->assertSame('The route internal/inspect/'.self::F.' could not be found.', $result->getExceptions()[0]->getValue());
        $breadcrumb = $result->getBreadcrumbs()[0];
        $this->assertSame('GET /internal/contracts/'.self::F, $breadcrumb->getMessage());
        $this->assertSame(['url' => '/internal/contracts/'.self::F], $breadcrumb->getMetadata());
    }

    public function test_scrubs_spans_of_a_transaction(): void
    {
        $span = new Span;
        $span->setDescription('GET https://taily.example/internal/contracts/abc123');
        $span->setData(['url' => 'https://taily.example/internal/contracts/abc123', 'http.response.status_code' => 200]);

        $event = Event::createTransaction();
        $event->setTransaction('/internal/contracts/{token}');
        $event->setSpans([$span]);

        SentryScrubber::beforeSend($event);

        $this->assertSame('/internal/contracts/{token}', $event->getTransaction());
        $this->assertSame('GET https://taily.example/internal/contracts/'.self::F, $span->getDescription());
        $this->assertSame(['url' => 'https://taily.example/internal/contracts/'.self::F, 'http.response.status_code' => 200], $span->getData());
    }
}
