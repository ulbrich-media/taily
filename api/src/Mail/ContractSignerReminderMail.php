<?php

namespace Taily\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Taily\Enums\ContractSignerRole;
use Taily\Models\ContractSigner;
use Taily\Support\FrontendUriBuilder;

class ContractSignerReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * The plaintext token is passed separately because it lives on the
     * signer's related AccessToken record, not a property of $signer itself.
     */
    public function __construct(
        public ContractSigner $signer,
        public string $plainTextToken,
        public int $daysRemaining,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Erinnerung: Schutzvertrag zur Unterschrift',
        );
    }

    public function content(): Content
    {
        $this->signer->loadMissing(['person', 'signingProcess.adoption.animal']);
        $adoption = $this->signer->signingProcess->adoption;

        return new Content(
            markdown: 'taily::emails.contract-signer-reminder',
            with: [
                'signUrl' => FrontendUriBuilder::contractSign($this->plainTextToken),
                'recipientName' => $this->signer->person->full_name,
                'animalName' => $adoption->animal->name,
                'isMediator' => $this->signer->role === ContractSignerRole::MEDIATOR,
                'daysRemaining' => $this->daysRemaining,
            ],
        );
    }
}
