<?php

namespace Taily\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Taily\Models\Adoption;

/**
 * Tells the applicant their application was declined (docs/features/adoption.md).
 * Only the reason written for the applicant is passed in, never the internal one.
 */
class ApplicationDeclinedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Adoption $adoption,
        public string $applicantReason = '',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Deine Bewerbung für {$this->adoption->animal->name}");
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'taily::emails.application-declined',
            with: [
                'name' => $this->adoption->applicant_first_name,
                'animalName' => $this->adoption->animal->name,
                'reason' => $this->applicantReason,
            ],
        );
    }
}
