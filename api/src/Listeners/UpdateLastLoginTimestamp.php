<?php

namespace Taily\Listeners;

use Illuminate\Auth\Events\Login;
use Taily\Models\User;

class UpdateLastLoginTimestamp
{
    /**
     * Handle the event.
     */
    public function handle(Login $event): void
    {
        if ($event->user instanceof User) {
            $event->user->forceFill(['last_login_at' => now()])->save();
        }
    }
}
