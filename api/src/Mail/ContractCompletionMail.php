<?php

namespace Taily\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Taily\Models\Adoption;

class ContractCompletionMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Adoption $adoption,
        public string $downloadUrl,
        public string $recipientName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Euer Schutzvertrag ist vollständig unterschrieben',
        );
    }

    public function content(): Content
    {
        $this->adoption->loadMissing('animal');

        return new Content(
            markdown: 'taily::emails.contract-completion',
            with: [
                'recipientName' => $this->recipientName,
                'animalName' => $this->adoption->animal->name,
                'downloadUrl' => $this->downloadUrl,
            ],
        );
    }
}
