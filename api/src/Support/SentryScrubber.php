<?php

namespace Taily\Support;

use Sentry\Breadcrumb;
use Sentry\Event;
use Sentry\EventHint;

/**
 * Removes access tokens from data before it is sent to Sentry.
 *
 * Several routes carry an access token as a path segment (e.g.
 * /internal/inspect/{token}/submit). Query strings are not collected at all
 * (see TailyServiceProvider), but path segments end up in request URLs,
 * exception messages, breadcrumbs and spans. Mirrors the frontend's
 * frontend/src/lib/sentryScrub.ts.
 */
class SentryScrubber
{
    public const FILTERED = '[Filtered]';

    // The segment after one of these path parts is a token. `/settings/contracts/`
    // holds contract template IDs in the admin, which are no secrets. Route
    // patterns (`{token}`, `$token`) are kept.
    private const TOKEN_PATH = '~(/(?:invitations?|inspect|confirm|login|(?<!settings/)contracts)/)(?![{$])[^/?#\s"\'<>]+~';

    public static function scrub(string $value): string
    {
        return (string) preg_replace(self::TOKEN_PATH, '$1'.self::FILTERED, $value);
    }

    /**
     * Replaces tokens in every string of the array, at any depth.
     *
     * @template K of array-key
     *
     * @param  array<K, mixed>  $values
     * @return array<K, mixed>
     */
    public static function scrubArray(array $values): array
    {
        foreach ($values as $key => $value) {
            if (is_string($value)) {
                $values[$key] = self::scrub($value);
            } elseif (is_array($value)) {
                $values[$key] = self::scrubArray($value);
            }
        }

        return $values;
    }

    /** `before_send` and `before_send_transaction` hook. */
    public static function beforeSend(Event $event, ?EventHint $hint = null): Event
    {
        $event->setRequest(self::scrubArray($event->getRequest()));
        $event->setTags(self::scrubArray($event->getTags()));
        $event->setExtra(self::scrubArray($event->getExtra()));

        if ($event->getTransaction() !== null) {
            $event->setTransaction(self::scrub($event->getTransaction()));
        }

        if ($event->getMessage() !== null) {
            $formatted = $event->getMessageFormatted();
            $event->setMessage(
                self::scrub($event->getMessage()),
                self::scrubArray($event->getMessageParams()),
                $formatted === null ? null : self::scrub($formatted),
            );
        }

        foreach ($event->getExceptions() as $exception) {
            $exception->setValue(self::scrub($exception->getValue()));
        }

        foreach ($event->getContexts() as $name => $context) {
            $event->setContext((string) $name, self::scrubArray($context));
        }

        $event->setBreadcrumb(array_map(self::beforeBreadcrumb(...), $event->getBreadcrumbs()));

        foreach ($event->getSpans() as $span) {
            if ($span->getDescription() !== null) {
                $span->setDescription(self::scrub($span->getDescription()));
            }
            $span->setData(self::scrubArray($span->getData()));
        }

        return $event;
    }

    /** `before_breadcrumb` hook. */
    public static function beforeBreadcrumb(Breadcrumb $breadcrumb): Breadcrumb
    {
        $message = $breadcrumb->getMessage();

        return new Breadcrumb(
            $breadcrumb->getLevel(),
            $breadcrumb->getType(),
            $breadcrumb->getCategory(),
            $message === null ? null : self::scrub($message),
            self::scrubArray($breadcrumb->getMetadata()),
            $breadcrumb->getTimestamp(),
        );
    }
}
