<?php

namespace Taily\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Taily\Models\UserInvitation;
use Taily\Support\FrontendUriBuilder;

class UserInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * The plaintext token is passed separately because the model only stores
     * its hash — and, unlike a transient model property, a plain string
     * survives SerializesModels if this mailable is ever queued.
     */
    public function __construct(
        public UserInvitation $invitation,
        public string $plainTextToken,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Deine Einladung zu Taily',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'taily::emails.user-invitation',
            with: [
                'invitationUrl' => $this->getInvitationUrl(),
                'expiresAt' => $this->invitation->expires_at,
            ],
        );
    }

    protected function getInvitationUrl(): string
    {
        return FrontendUriBuilder::userInvite($this->plainTextToken);
    }
}
