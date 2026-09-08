<?php

namespace Taily\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Taily\Models\ContractSigner;

class ContractSigningCancelledMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ContractSigner $signer,
        public string $animalName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Signaturvorgang abgebrochen',
        );
    }

    public function content(): Content
    {
        $this->signer->loadMissing('person');

        return new Content(
            markdown: 'taily::emails.contract-signing-cancelled',
            with: [
                'recipientName' => $this->signer->person->full_name,
                'animalName' => $this->animalName,
            ],
        );
    }
}
