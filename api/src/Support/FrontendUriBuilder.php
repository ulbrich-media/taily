<?php

namespace Taily\Support;

class FrontendUriBuilder
{
    public static function inspect(string $token): string
    {
        return self::callback('inspect', $token);
    }

    public static function contractSign(string $token): string
    {
        return self::callback('contract_sign', $token);
    }

    public static function userInvite(string $token): string
    {
        return self::callback('user_invite_accepted', $token);
    }

    public static function passwordReset(string $token, string $email): string
    {
        return self::callback('password_reset', $token, ['email' => $email]);
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
