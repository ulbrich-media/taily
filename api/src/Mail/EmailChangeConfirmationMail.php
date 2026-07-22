<?php

namespace Taily\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Taily\Models\PendingEmailChange;
use Taily\Support\FrontendUriBuilder;

class EmailChangeConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * The plaintext token is passed separately because the model only stores
     * its hash — and, unlike a transient model property, a plain string
     * survives SerializesModels if this mailable is ever queued.
     */
    public function __construct(
        public PendingEmailChange $pendingEmailChange,
        public string $plainTextToken,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Bestätige deine neue E-Mail-Adresse',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'taily::emails.email-change-confirmation',
            with: [
                'confirmUrl' => $this->getConfirmUrl(),
                'expiresAt' => $this->pendingEmailChange->expires_at,
            ],
        );
    }

    protected function getConfirmUrl(): string
    {
        return FrontendUriBuilder::emailChange($this->plainTextToken);
    }
}
