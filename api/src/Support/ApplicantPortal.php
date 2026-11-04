<?php

namespace Taily\Support;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Taily\Enums\AdoptionStep;
use Taily\Mail\ApplicantLoginMail;
use Taily\Mail\ApplicationConfirmMail;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\ApplicantLink;
use Taily\Models\ApplicantSession;
use Taily\Models\FieldDefinition;
use Taily\Support\CaseFile\CaseFileService;
use Taily\Support\CaseFile\CaseFileState;
use Taily\Support\CaseFile\ChecklistItem;

/**
 * Public applications and the applicant portal (docs/features/adoption.md,
 * docs/features/applicant-portal.md). The applicant's email is their
 * identity: an application is confirmed by email, and the portal shows
 * every adoption with that email (ADR-017).
 */
class ApplicantPortal
{
    /** Statuses the applicant may still change their data in. */
    private const EDITABLE = ['pending', 'in_progress'];

    public function __construct(
        private CaseFileService $caseFile,
    ) {}

    /**
     * Whether the animal takes applications: alive, not a boarding animal,
     * and not adopted yet. A reserved animal still does; the mediator
     * decides.
     */
    public function acceptsApplications(Animal $animal): bool
    {
        return ! $animal->is_deceased
            && ! $animal->is_boarding_animal
            && ! $animal->adoptions()->where('status', 'done')->exists();
    }

    /**
     * The application form: the catalogue fields of the animal's type the
     * applicant is asked at the application step.
     *
     * @return array<string, mixed>
     */
    public function applicationForm(Animal $animal): array
    {
        $draft = new Adoption(['animal_id' => $animal->id]);
        $draft->setRelation('animal', $animal);
        $draft->setRelation('mediator', null);
        $draft->setRelation('fieldValues', collect());
        $draft->setRelation('requirements', collect());

        return $this->forApplicant($this->caseFile->present($draft), AdoptionStep::APPLICATION, lockEmail: false);
    }

    /**
     * Stores an application as an unconfirmed adoption and emails the
     * confirmation link. Required fields of the application step have to be
     * there, except files, which the prototype can't take yet.
     *
     * @param  array<string, mixed>  $values
     */
    public function apply(Animal $animal, array $values): Adoption
    {
        if (! $this->acceptsApplications($animal)) {
            throw ValidationException::withMessages(['animal' => ['Für dieses Tier sind keine Bewerbungen möglich.']]);
        }

        $allowed = $this->writableKeys($this->definitionsFor($animal->animal_type_id), AdoptionStep::APPLICATION, withEmail: true);

        // Everything missing is reported at once, before the values are
        // validated one by one.
        $state = new CaseFileState($animal->animal_type_id, collect($values)->only($allowed)->all());
        $missing = collect($this->caseFile->calculator($animal->animal_type_id)->forStep($state, AdoptionStep::APPLICATION)->open())
            ->filter(fn (ChecklistItem $item) => in_array($item->key, $allowed, true));

        if ($missing->isNotEmpty()) {
            throw ValidationException::withMessages(
                $missing->mapWithKeys(fn (ChecklistItem $item) => ["values.{$item->key}" => ['Bitte ausfüllen.']])->all()
            );
        }

        [$adoption, $token] = DB::transaction(function () use ($animal, $values, $allowed) {
            $adoption = Adoption::create(['animal_id' => $animal->id, 'status' => 'unconfirmed']);
            $this->caseFile->update($adoption, $values, null, $allowed);

            if ($adoption->applicant_email === '') {
                throw ValidationException::withMessages(['values.email' => ['Bitte ausfüllen.']]);
            }

            [, $token] = ApplicantLink::issue(ApplicantLink::PURPOSE_CONFIRM, $adoption->applicant_email, $adoption);

            return [$adoption, $token];
        });

        Mail::to($adoption->applicant_email)->send(new ApplicationConfirmMail($adoption, $token));

        return $adoption;
    }

    /**
     * Confirms an application; confirming is the first login.
     *
     * @return string|null the plaintext session token, null for an unusable link
     */
    public function confirm(string $token): ?string
    {
        return DB::transaction(function () use ($token) {
            $link = ApplicantLink::findUsable(ApplicantLink::PURPOSE_CONFIRM, $token);

            if ($link === null) {
                return null;
            }

            $link->update(['used_at' => now()]);
            Adoption::whereKey($link->adoption_id)->where('status', 'unconfirmed')->update(['status' => 'pending']);

            return ApplicantSession::open($link->email)[1];
        });
    }

    /**
     * Emails a login link when the address has adoptions to show. The
     * caller answers the same either way, so nobody learns whether an
     * address is known.
     */
    public function requestLogin(string $email): void
    {
        $email = Adoption::normalizeEmail($email);

        if (! $this->adoptionsOf($email)->exists()) {
            return;
        }

        [, $token] = ApplicantLink::issue(ApplicantLink::PURPOSE_LOGIN, $email);

        Mail::to($email)->send(new ApplicantLoginMail($token));
    }

    /**
     * @return string|null the plaintext session token, null for an unusable link
     */
    public function login(string $token): ?string
    {
        return DB::transaction(function () use ($token) {
            $link = ApplicantLink::findUsable(ApplicantLink::PURPOSE_LOGIN, $token);

            if ($link === null) {
                return null;
            }

            $link->update(['used_at' => now()]);

            return ApplicantSession::open($link->email)[1];
        });
    }

    /**
     * The adoptions the portal shows for an email. Unconfirmed applications
     * aren't among them: confirming them is the first login.
     */
    public function adoptionsOf(string $email)
    {
        return Adoption::where('applicant_email', Adoption::normalizeEmail($email))
            ->where('applicant_email', '!=', '')
            ->where('status', '!=', 'unconfirmed');
    }

    /**
     * The step the applicant is asked for data up to: the first step that
     * isn't finished. Requesting data explicitly (`requested_step`) isn't part
     * of the prototype.
     */
    public function currentStep(Adoption $adoption): AdoptionStep
    {
        return match (true) {
            in_array($adoption->status, ['unconfirmed', 'pending'], true) => AdoptionStep::APPLICATION,
            $adoption->pre_inspection_status !== 'finished' => AdoptionStep::PRE_INSPECTION,
            $adoption->contract_status !== 'finished' => AdoptionStep::CONTRACT,
            $adoption->transport_status !== 'finished' => AdoptionStep::TRANSPORT,
            default => AdoptionStep::HANDOVER,
        };
    }

    public function isEditable(Adoption $adoption): bool
    {
        return in_array($adoption->status, self::EDITABLE, true);
    }

    /**
     * What the portal shows of one adoption. A canceled adoption shows only
     * that it ended — no data, no reason.
     *
     * @return array<string, mixed>
     */
    public function present(Adoption $adoption): array
    {
        $adoption->loadMissing(['animal.animalType', 'animal.media', 'preInspections', 'transport', 'latestContractSigningProcess']);

        $base = [
            'id' => $adoption->id,
            'status' => $adoption->status,
            'created_at' => $adoption->created_at,
            'animal' => [
                'name' => $adoption->animal->name,
                'animal_type' => $adoption->animal->animalType?->title,
                'picture_url' => $adoption->animal->getProfilePictureMedia()?->getTemporaryUrl(now()->addHour(), 'thumbnail'),
            ],
        ];

        if ($adoption->status === 'canceled') {
            return $base;
        }

        $step = $this->currentStep($adoption);

        return $base + [
            'editable' => $this->isEditable($adoption),
            'current_step' => $step->value,
            'steps' => [
                // Under review until the mediator starts working on it.
                ['step' => 'application', 'status' => $adoption->status === 'pending' ? 'pending' : 'finished'],
                ['step' => 'pre_inspection', 'status' => $adoption->pre_inspection_status],
                ['step' => 'contract', 'status' => $adoption->contract_status],
                ['step' => 'transport', 'status' => $adoption->transport_status, 'planned_at' => $adoption->transport?->planned_at],
                ['step' => 'handover', 'status' => $adoption->handover_status],
            ],
            ...$this->forApplicant($this->caseFile->present($adoption), $step, lockEmail: true),
        ];
    }

    /**
     * Saves the applicant's changes: only fields they are asked for up to the
     * current step, and only while the adoption is running. The email stays:
     * it is what the portal login is tied to.
     *
     * @param  array<string, mixed>  $values
     */
    public function update(Adoption $adoption, array $values): void
    {
        if (! $this->isEditable($adoption)) {
            throw ValidationException::withMessages(['values' => ['Diese Bewerbung kann nicht mehr geändert werden.']]);
        }

        $allowed = $this->writableKeys(
            $this->definitionsFor($adoption->animal->animal_type_id),
            $this->currentStep($adoption),
            withEmail: false,
        );

        $this->caseFile->update($adoption, $values, null, $allowed);
    }

    /**
     * Narrows the mediator's view of the Case File to what the applicant
     * sees up to a step: their fields and their open checklist items. The
     * mediator's per-adoption overrides stay internal; their effect on what
     * is required doesn't.
     *
     * @param  array<string, mixed>  $presented  CaseFileService::present()
     * @return array{groups: list<array<string, mixed>>, open: list<array<string, mixed>>}
     */
    private function forApplicant(array $presented, AdoptionStep $step, bool $lockEmail): array
    {
        $visible = fn (array $field) => $field['visible_to_applicant']
            && AdoptionStep::from($field['collect_at'])->isAtOrBefore($step);

        $groups = collect($presented['groups'])
            ->map(function (array $group) use ($visible, $lockEmail) {
                $group['fields'] = collect($group['fields'])
                    ->filter($visible)
                    ->map(fn (array $field) => [
                        ...$field,
                        // The mediator's per-adoption overrides stay internal.
                        'override' => null,
                        // Read-only in the portal: it is what the login is tied to.
                        'locked' => $lockEmail && $field['built_in'] && $field['key'] === 'email',
                    ])
                    ->values();

                return $group;
            })
            ->filter(fn (array $group) => $group['fields']->isNotEmpty())
            ->values();

        $keys = $groups->flatMap(fn (array $group) => $group['fields']->pluck('key'))->all();

        $open = collect($presented['checklists'][$step->value]['items'] ?? [])
            ->filter(fn (array $item) => $item['status'] !== 'done' && in_array($item['key'], $keys, true))
            ->values()
            ->all();

        return ['groups' => $groups->all(), 'open' => $open];
    }

    /**
     * @return Collection<int, FieldDefinition>
     */
    private function definitionsFor(string $animalTypeId): Collection
    {
        return $this->caseFile->definitions($animalTypeId);
    }

    /**
     * The keys the applicant may write up to a step. Files and Info Blocks
     * aren't part of the prototype's forms.
     *
     * @param  Collection<int, FieldDefinition>  $definitions
     * @return list<string>
     */
    private function writableKeys(Collection $definitions, AdoptionStep $step, bool $withEmail): array
    {
        return $definitions
            ->filter(fn (FieldDefinition $definition) => $definition->visible_to_applicant
                && $definition->collect_at->isAtOrBefore($step)
                && $definition->type->holdsValue()
                && ! $definition->type->isFile()
                && ($withEmail || $definition->applicant_attribute !== 'email'))
            ->pluck('key')
            ->values()
            ->all();
    }
}
