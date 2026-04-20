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

    public function __construct(
        public UserInvitation $invitation
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Einladung zum Adoption Manager',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'taily::emails.user-invitation',
            with: [
                'invitationUrl' => $this->getInvitationUrl(),
                'expiresAt' => $this->invitation->expires_at,
            ],
        );
    }

    protected function getInvitationUrl(): string
    {
        return FrontendUriBuilder::userInvite($this->invitation->token);
    }
}
