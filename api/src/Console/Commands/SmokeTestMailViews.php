<?php

namespace Taily\Console\Commands;

use Illuminate\Console\Command;
use Taily\Mail\PasswordResetMail;
use Taily\Mail\SecurityNotificationMail;
use Taily\Mail\UserInvitationMail;
use Taily\Models\User;
use Taily\Models\UserInvitation;
use Throwable;

class SmokeTestMailViews extends Command
{
    protected $signature = 'taily:smoke-test-mail';

    /**
     * Renders (but does not send) every transactional mailable. This exists
     * because these views resolve differently once Taily is installed as a
     * Composer dependency: `resource_path()` and `app_path()` then point
     * into the consuming app, not into this package, so a missing
     * `publishes()` mapping or autoload entry only surfaces there — never
     * when the package is run standalone during local development.
     */
    protected $description = 'Render every transactional mail view to catch package-boundary issues invisible in local development';

    public function handle(): int
    {
        $mailables = [
            'UserInvitationMail' => fn () => new UserInvitationMail(
                new UserInvitation(['expires_at' => now()->addDays(3)]),
                'smoke-test-token',
            ),
            'PasswordResetMail' => fn () => new PasswordResetMail(
                new User(['email' => 'smoke-test@example.com']),
                'smoke-test-token',
            ),
            'SecurityNotificationMail' => fn () => new SecurityNotificationMail(
                'Smoke test heading',
                'Smoke test description',
            ),
        ];

        $failures = [];

        foreach ($mailables as $name => $factory) {
            try {
                $factory()->render();
                $this->info("PASS  {$name}");
            } catch (Throwable $e) {
                $failures[] = $name;
                $this->error("FAIL  {$name}: {$e->getMessage()}");
            }
        }

        return $failures === [] ? self::SUCCESS : self::FAILURE;
    }
}
