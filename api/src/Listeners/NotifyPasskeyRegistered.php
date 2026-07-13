<?php

namespace Taily\Listeners;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Laravel\Passkeys\Events\PasskeyRegistered;
use Taily\Mail\SecurityNotificationMail;
use Taily\Models\User;
use Throwable;

class NotifyPasskeyRegistered
{
    /**
     * Handle the event.
     */
    public function handle(PasskeyRegistered $event): void
    {
        if (! $event->user instanceof User) {
            return;
        }

        // The passkey is already stored at this point, so a mail delivery
        // failure must not turn into a 500 for the user.
        try {
            Mail::to($event->user->email)->send(new SecurityNotificationMail(
                'Neuer Passkey hinzugefügt',
                "Für dein Konto wurde ein neuer Passkey (\"{$event->passkey->name}\") hinzugefügt."
            ));
        } catch (Throwable $e) {
            Log::error('Failed to send passkey added security notification', [
                'user_id' => $event->user->id,
                'exception' => $e,
            ]);
        }
    }
}
