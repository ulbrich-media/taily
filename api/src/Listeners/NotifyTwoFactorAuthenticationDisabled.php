<?php

namespace Taily\Listeners;

use Illuminate\Support\Facades\Mail;
use Laravel\Fortify\Events\TwoFactorAuthenticationDisabled;
use Taily\Mail\SecurityNotificationMail;
use Taily\Models\User;

class NotifyTwoFactorAuthenticationDisabled
{
    /**
     * Handle the event.
     */
    public function handle(TwoFactorAuthenticationDisabled $event): void
    {
        if ($event->user instanceof User) {
            Mail::to($event->user->email)->send(new SecurityNotificationMail(
                $event->user,
                'Zwei-Faktor-Authentifizierung deaktiviert',
                'Die Zwei-Faktor-Authentifizierung wurde für dein Konto deaktiviert.'
            ));
        }
    }
}
