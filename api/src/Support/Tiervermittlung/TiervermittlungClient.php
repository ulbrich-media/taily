<?php

namespace Taily\Support\Tiervermittlung;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;

/**
 * Thin wrapper around the Tiervermittlung.de Partner-API v1. Takes care of
 * authentication, the rate limit (pause between requests, one retry after
 * `Retry-After` on 429) and turning error bodies into exceptions.
 */
class TiervermittlungClient
{
    /** Longest `Retry-After` we are willing to wait inside one run. */
    private const MAX_RETRY_AFTER_SECONDS = 60;

    private bool $hasSentRequest = false;

    public function __construct(
        private string $baseUrl,
        private string $apiKey,
        private int $requestIntervalMs = 0,
    ) {}

    /**
     * Account name, location and listing counts. The cheapest way to check
     * that the key works.
     *
     * @return array<string, mixed>
     */
    public function account(): array
    {
        return $this->send('get', 'konto')->json() ?? [];
    }

    /**
     * Create or update a listing with the complete current state of the
     * animal. With `$probe` nothing is created; the platform answers with a
     * preview of the listing instead.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function putAnimal(string $tierId, array $payload, bool $probe = false): array
    {
        $path = 'tiere/'.rawurlencode($tierId).($probe ? '?probe=1' : '');

        return $this->send('put', $path, $payload)->json() ?? [];
    }

    /**
     * Remove a listing. `vermittelt` counts towards the placement statistics
     * on the platform, `entfernt` does not.
     */
    public function deleteAnimal(string $tierId, string $reason): void
    {
        $this->send('delete', 'tiere/'.rawurlencode($tierId).'?grund='.$reason);
    }

    /**
     * Hand over the complete list of tier ids that should be listed. The
     * platform removes every other API listing of the account, unless its
     * safety brake decides the list looks incomplete.
     *
     * @param  list<string>  $tierIds
     * @return array<string, mixed>
     */
    public function reconcile(array $tierIds): array
    {
        return $this->send('post', 'abgleich', ['tierIds' => $tierIds])->json() ?? [];
    }

    /**
     * @param  array<string, mixed>|null  $body
     */
    private function send(string $method, string $path, ?array $body = null): Response
    {
        $response = $this->attempt($method, $path, $body);

        if ($response->status() === 429) {
            $wait = min((int) ($response->header('Retry-After') ?: 1), self::MAX_RETRY_AFTER_SECONDS);
            Sleep::for(max($wait, 1))->seconds();
            $response = $this->attempt($method, $path, $body);
        }

        if ($response->failed()) {
            throw new TiervermittlungException(
                $response->json('fehler') ?: "HTTP {$response->status()}",
                $response->status(),
                $response->json('feld'),
            );
        }

        return $response;
    }

    /**
     * @param  array<string, mixed>|null  $body
     */
    private function attempt(string $method, string $path, ?array $body): Response
    {
        if ($this->hasSentRequest && $this->requestIntervalMs > 0) {
            Sleep::for($this->requestIntervalMs)->milliseconds();
        }

        $this->hasSentRequest = true;

        try {
            return $this->request()->send(strtoupper($method), $path, $body === null ? [] : ['json' => $body]);
        } catch (ConnectionException $e) {
            throw new TiervermittlungException('Tiervermittlung.de ist nicht erreichbar: '.$e->getMessage());
        }
    }

    private function request(): PendingRequest
    {
        return Http::baseUrl(rtrim($this->baseUrl, '/').'/')
            ->withToken($this->apiKey)
            ->acceptJson()
            ->timeout(30);
    }
}
