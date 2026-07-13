<?php

namespace Taily\Listeners;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Laravel\Passkeys\Events\PasskeyDeleted;
use Taily\Mail\SecurityNotificationMail;
use Taily\Models\User;
use Throwable;

class NotifyPasskeyDeleted
{
    /**
     * Handle the event.
     */
    public function handle(PasskeyDeleted $event): void
    {
        if (! $event->user instanceof User) {
            return;
        }

        // The passkey is already removed at this point, so a mail delivery
        // failure must not turn into a 500 for the user.
        try {
            Mail::to($event->user->email)->send(new SecurityNotificationMail(
                'Passkey entfernt',
                "Der Passkey \"{$event->passkey->name}\" wurde von deinem Konto entfernt."
            ));
        } catch (Throwable $e) {
            Log::error('Failed to send passkey removed security notification', [
                'user_id' => $event->user->id,
                'exception' => $e,
            ]);
        }
    }
}
