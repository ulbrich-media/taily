<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Laravel\Passkeys\Events\PasskeyDeleted;
use Laravel\Passkeys\Events\PasskeyRegistered;
use Laravel\Passkeys\Passkey;
use Taily\Mail\SecurityNotificationMail;
use Taily\Models\User;
use Taily\Tests\TestCase;

class PasskeyNotificationTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(): User
    {
        return User::factory()->create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ]);
    }

    private function createPasskey(User $user, string $name = 'YubiKey'): Passkey
    {
        return $user->passkeys()->create([
            'name' => $name,
            'credential_id' => 'credential-id',
            'credential' => ['type' => 'public-key'],
        ]);
    }

    public function test_registering_a_passkey_sends_a_security_notification(): void
    {
        $user = $this->createUser();
        $passkey = $this->createPasskey($user);

        Mail::fake();

        Event::dispatch(new PasskeyRegistered($user, $passkey));

        Mail::assertSent(SecurityNotificationMail::class, fn (SecurityNotificationMail $mail) => $mail->hasTo($user->email));
        Mail::assertSent(SecurityNotificationMail::class, 1);
    }

    public function test_deleting_a_passkey_sends_a_security_notification(): void
    {
        $user = $this->createUser();
        $passkey = $this->createPasskey($user);

        Mail::fake();

        Event::dispatch(new PasskeyDeleted($user, $passkey));

        Mail::assertSent(SecurityNotificationMail::class, fn (SecurityNotificationMail $mail) => $mail->hasTo($user->email));
        Mail::assertSent(SecurityNotificationMail::class, 1);
    }
}
