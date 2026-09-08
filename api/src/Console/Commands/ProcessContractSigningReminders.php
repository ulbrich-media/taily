<?php

namespace Taily\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Taily\Mail\ContractExpiredMail;
use Taily\Mail\ContractSignerReminderMail;
use Taily\Models\ContractSigner;
use Taily\Support\ContractSigningService;
use Throwable;

class ProcessContractSigningReminders extends Command
{
    protected $signature = 'contracts:process-reminders';

    protected $description = 'Send reminder emails for signing links approaching expiry, and expire ones past their window';

    public function __construct(private ContractSigningService $signingService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->sendReminders($this->signingService->signersDueForWeekReminder(), 'week', 7);
        $this->sendReminders($this->signingService->signersDueForTwoDayReminder(), 'two_days', 2);
        $this->expireSigners($this->signingService->signersPastExpiry());

        return self::SUCCESS;
    }

    /**
     * @param  Collection<int, ContractSigner>  $signers
     */
    private function sendReminders(Collection $signers, string $threshold, int $daysRemaining): void
    {
        foreach ($signers as $signer) {
            try {
                $signer->loadMissing('person');
                $token = $signer->activeToken();

                if (! $signer->person?->email || ! $token) {
                    continue;
                }

                Mail::to($signer->person->email)->send(
                    new ContractSignerReminderMail($signer, $token->token, $daysRemaining)
                );
                $this->signingService->markReminderSent($signer, $threshold);
            } catch (Throwable $e) {
                Log::error('Failed to send contract signer reminder', [
                    'signer_id' => $signer->id,
                    'threshold' => $threshold,
                    'exception' => $e,
                ]);
            }
        }
    }

    /**
     * @param  Collection<int, ContractSigner>  $signers
     */
    private function expireSigners(Collection $signers): void
    {
        foreach ($signers as $signer) {
            try {
                $process = $signer->signingProcess;
                $expiredRole = $signer->role;

                $this->signingService->expire($process);

                $process->loadMissing('adoption.mediator', 'adoption.animal');
                $mediator = $process->adoption->mediator;

                if ($mediator?->email) {
                    Mail::to($mediator->email)->send(new ContractExpiredMail($process, $expiredRole));
                }
            } catch (Throwable $e) {
                Log::error('Failed to expire contract signing process', [
                    'signing_process_id' => $signer->signing_process_id,
                    'exception' => $e,
                ]);
            }
        }
    }
}
