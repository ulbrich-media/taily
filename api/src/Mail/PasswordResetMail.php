<?php

namespace Taily\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Taily\Models\User;
use Taily\Support\FrontendUriBuilder;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $token
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Passwort zurücksetzen',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'taily::emails.password-reset',
            with: [
                'resetUrl' => $this->getResetUrl(),
                'expiresInMinutes' => (int) config('auth.passwords.users.expire', 60),
            ],
        );
    }

    protected function getResetUrl(): string
    {
        return FrontendUriBuilder::passwordReset($this->token, $this->user->email);
    }
}
