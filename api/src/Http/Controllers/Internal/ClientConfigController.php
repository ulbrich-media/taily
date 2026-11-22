<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Taily\Http\Controllers\Controller;

/**
 * Runtime configuration the frontend needs before it renders. The frontend
 * assets are built once per release and shared by every installation, so
 * per-installation values cannot be baked in at build time.
 *
 * Everything returned here is public by design: a Sentry DSN only allows
 * sending events, never reading them.
 */
class ClientConfigController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'sentry' => $this->sentry(),
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function sentry(): ?array
    {
        $dsn = (string) config('taily.sentry.frontend_dsn');

        if ($dsn === '') {
            return null;
        }

        return [
            'dsn' => $dsn,
            'environment' => (string) config('taily.sentry.environment'),
            'release' => config('taily.sentry.release'),
            'instance' => (string) config('taily.sentry.instance'),
            'traces_sample_rate' => (float) config('taily.sentry.frontend_traces_sample_rate'),
            'replays_session_sample_rate' => (float) config('taily.sentry.frontend_replays_session_sample_rate'),
            'replays_on_error_sample_rate' => (float) config('taily.sentry.frontend_replays_on_error_sample_rate'),
        ];
    }
}
