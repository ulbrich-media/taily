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

    private static function callback(string $action, string $token): string
    {
        $base = rtrim(config('app.frontend_url'), '/');

        return "{$base}/callback?action={$action}&token={$token}";
    }
}
