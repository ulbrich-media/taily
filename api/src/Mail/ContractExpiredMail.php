<?php

namespace Taily\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Taily\Enums\ContractSignerRole;
use Taily\Models\ContractSigningProcess;
use Taily\Support\FrontendUriBuilder;

class ContractExpiredMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Always sent to the mediator, regardless of which side's link expired
     * — matching the cancellation flow's notification pattern.
     */
    public function __construct(
        public ContractSigningProcess $process,
        public ContractSignerRole $expiredSignerRole,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Signaturvorgang abgelaufen',
        );
    }

    public function content(): Content
    {
        $this->process->loadMissing(['adoption.animal', 'adoption.mediator']);
        $adoption = $this->process->adoption;

        return new Content(
            markdown: 'taily::emails.contract-expired',
            with: [
                'recipientName' => $adoption->mediator->full_name,
                'animalName' => $adoption->animal->name,
                'expiredSignerIsMediator' => $this->expiredSignerRole === ContractSignerRole::MEDIATOR,
                'adoptionUrl' => FrontendUriBuilder::adoptionDetail($adoption->id),
            ],
        );
    }
}
