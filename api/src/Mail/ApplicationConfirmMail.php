<?php

namespace Taily\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Taily\Models\Adoption;
use Taily\Models\ApplicantLink;
use Taily\Support\FrontendUriBuilder;

/**
 * Double opt-in of a public application (docs/features/adoption.md). The
 * plaintext token is passed in because only its hash is stored.
 */
class ApplicationConfirmMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Adoption $adoption,
        public string $plainTextToken,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Bitte bestätige deine Bewerbung für {$this->adoption->animal->name}");
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'taily::emails.application-confirm',
            with: [
                'name' => $this->adoption->applicant_first_name,
                'animalName' => $this->adoption->animal->name,
                'url' => FrontendUriBuilder::applicationConfirm($this->plainTextToken),
                'hours' => ApplicantLink::LIFETIME_HOURS,
            ],
        );
    }
}
