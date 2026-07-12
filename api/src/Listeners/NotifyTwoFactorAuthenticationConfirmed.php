<?php

namespace Taily\Listeners;

use Illuminate\Support\Facades\Mail;
use Laravel\Fortify\Events\TwoFactorAuthenticationConfirmed;
use Taily\Mail\SecurityNotificationMail;
use Taily\Models\User;

class NotifyTwoFactorAuthenticationConfirmed
{
    /**
     * Handle the event.
     */
    public function handle(TwoFactorAuthenticationConfirmed $event): void
    {
        if ($event->user instanceof User) {
            Mail::to($event->user->email)->send(new SecurityNotificationMail(
                $event->user,
                'Zwei-Faktor-Authentifizierung aktiviert',
                'Die Zwei-Faktor-Authentifizierung wurde für dein Konto aktiviert.'
            ));
        }
    }
}
