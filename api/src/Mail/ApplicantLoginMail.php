<?php

namespace Taily\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Taily\Models\ApplicantLink;
use Taily\Support\FrontendUriBuilder;

/**
 * The magic link into the applicant portal (docs/features/applicant-portal.md).
 */
class ApplicantLoginMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $plainTextToken,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Dein Link zu deinen Bewerbungen');
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'taily::emails.applicant-login',
            with: [
                'url' => FrontendUriBuilder::applicantLogin($this->plainTextToken),
                'hours' => ApplicantLink::LIFETIME_HOURS,
            ],
        );
    }
}
