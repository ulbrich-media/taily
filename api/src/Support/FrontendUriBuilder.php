<?php

namespace Taily\Support;

class FrontendUriBuilder
{
    public static function inspect(string $token): string
    {
        return static::callback('inspect', $token);
    }

    public static function userInvite(string $token): string
    {
        return static::callback('user_invite_accepted', $token);
    }

    public static function passwordReset(string $token, string $email): string
    {
        return static::callback('password_reset', $token, ['email' => $email]);
    }

    /**
     * @param  array<string, string>  $extraParams
     */
    private static function callback(string $action, string $token, array $extraParams = []): string
    {
        $base = rtrim(config('taily.frontend_url'), '/');
        $query = http_build_query(['action' => $action, 'token' => $token, ...$extraParams]);

        return "{$base}/callback?{$query}";
    }
}
