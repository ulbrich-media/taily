<?php

namespace Taily\Support;

use Sentry\Breadcrumb;
use Sentry\Event;
use Sentry\EventHint;
use Sentry\Logs\Log;

/**
 * Removes access tokens from data before it is sent to Sentry.
 *
 * Several routes carry an access token as a path segment (e.g.
 * /internal/inspect/{token}/submit). Query strings are not collected at all
 * (see TailyServiceProvider), but path segments end up in request URLs,
 * exception messages, breadcrumbs, spans and logs. Mirrors the frontend's
 * frontend/src/lib/sentryScrub.ts.
 */
class SentryScrubber
{
    public const FILTERED = '[Filtered]';

    // The segment after one of these path parts is a token. `/settings/contracts/`
    // holds contract template IDs in the admin, which are no secrets. Route
    // patterns (`{token}`, `$token`) are kept.
    private const TOKEN_PATH = '~(/(?:invitations?|inspect|confirm|login|(?<!settings/)contracts)/)(?![{$])[^/?#\s"\'<>]+~';

    // Deeper data (or a reference cycle) is replaced instead of traversed.
    private const MAX_DEPTH = 10;

    public static function scrub(string $value): string
    {
        return (string) preg_replace(self::TOKEN_PATH, '$1'.self::FILTERED, $value);
    }

    /**
     * Replaces tokens in every string of the array, also inside nested arrays
     * and the public properties of objects (which the SDK serializes). An
     * object is replaced by its scrubbed properties only if it held a token.
     *
     * @template K of array-key
     *
     * @param  array<K, mixed>  $values
     * @return array<K, mixed>
     */
    public static function scrubArray(array $values, int $depth = 0): array
    {
        foreach ($values as $key => $value) {
            if (is_string($value)) {
                $values[$key] = self::scrub($value);
            } elseif (is_array($value) || is_object($value)) {
                if ($depth + 1 >= self::MAX_DEPTH) {
                    $values[$key] = self::FILTERED;
                } elseif (is_array($value)) {
                    $values[$key] = self::scrubArray($value, $depth + 1);
                } else {
                    $properties = get_object_vars($value);
                    $scrubbed = self::scrubArray($properties, $depth + 1);
                    if ($scrubbed !== $properties) {
                        $values[$key] = $scrubbed;
                    }
                }
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

        $message = $event->getMessage();
        if ($message !== null) {
            $formatted = $event->getMessageFormatted();
            $scrubbedFormatted = $formatted === null ? null : self::scrub($formatted);
            $tokenFound = $scrubbedFormatted !== $formatted || self::scrub($message) !== $message;
            $event->setMessage(
                self::scrub($message),
                // A parameter can be the bare token, which no pattern recognizes.
                $tokenFound ? [] : self::scrubArray($event->getMessageParams()),
                $scrubbedFormatted,
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

    /** `before_send_log` hook, for Laravel logs sent through `sentry_logs`. */
    public static function beforeSendLog(Log $log): Log
    {
        $body = $log->getBody();
        $log->setBody(self::scrub($body));
        $tokenFound = $log->getBody() !== $body;

        foreach ($log->attributes()->all() as $key => $attribute) {
            // A parameter can be the bare token, which no pattern recognizes.
            if ($tokenFound && str_starts_with($key, 'sentry.message.parameter.')) {
                $log->attributes()->forget($key);
            } elseif (is_string($value = $attribute->getValue())) {
                $log->attributes()->set($key, self::scrub($value));
            }
        }

        return $log;
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
