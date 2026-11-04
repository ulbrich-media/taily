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

    public static function applicationConfirm(string $token): string
    {
        return self::callback('application_confirm', $token);
    }

    public static function applicantLogin(string $token): string
    {
        return self::callback('applicant_login', $token);
    }

    /**
     * The public application form of an animal, linked from its admin page.
     * Not a token callback: whoever has the link may apply.
     */
    public static function application(string $animalId): string
    {
        $base = rtrim(config('taily.frontend_url'), '/');

        return "{$base}/apply/{$animalId}";
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
     * Direct link into the authenticated admin SPA, not a token callback —
     * the recipient (a Mediator) already has a Taily login.
     */
    public static function adoptionDetail(string $adoptionId): string
    {
        $base = rtrim(config('taily.frontend_url'), '/');

        return "{$base}/admin/adoptions/{$adoptionId}";
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
