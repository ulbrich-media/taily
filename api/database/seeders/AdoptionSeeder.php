<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Database\Seeders\Support\AdoptionStage;
use Database\Seeders\Support\AdoptionTimeline;
use Database\Seeders\Support\SeedRandom;
use Database\Seeders\Support\TransportPool;
use Database\Seeders\Support\TransportState;
use Faker\Factory as Faker;
use Faker\Generator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\Person;
use Taily\Models\PreInspection;
use Taily\Models\Transport;

/**
 * Adoptions, together with everything that hangs off them: the pre-inspection,
 * the transport run, and the placement state on the animal.
 *
 * Each adoption is generated from an AdoptionStage rather than from a literal
 * row, so what exists is decided once per adoption and stays consistent: a
 * transport is only ever assigned to an adoption whose contract is signed, an
 * inspection is always submitted before that contract, and an animal is only
 * ever handed over after its transport arrived.
 */
class AdoptionSeeder extends Seeder
{
    /**
     * Relative frequency of each stage. Roughly shaped like a real caseload:
     * a steady stream of applications, a few active at every step, and a
     * larger pile of finished ones behind them.
     */
    public const DEFAULT_STAGE_WEIGHTS = [
        'applied' => 3,
        'in_review' => 2,
        'inspected' => 2,
        'contract_signed' => 2,
        'transport_planned' => 2,
        'transport_done' => 1,
        'handed_over' => 4,
        'canceled' => 2,
    ];

    private Generator $faker;

    /** @var Collection<int, Person> */
    private Collection $mediators;

    /** @var Collection<string, Collection<int, Person>> mediators keyed by animal type id */
    private Collection $mediatorsByAnimalType;

    /** @var Collection<string, Collection<int, Person>> inspectors keyed by animal type id */
    private Collection $inspectorsByAnimalType;

    /** @var Collection<int, Person> */
    private Collection $applicants;

    /**
     * When each animal became available again, so a second adoption for the
     * same animal can never overlap the first.
     *
     * @var array<string, CarbonImmutable>
     */
    private array $availableFrom = [];

    /**
     * The pre-inspection each person already has per animal type, as
     * ['at' => when it last moved, 'submitted' => whether it came back].
     *
     * Pre-inspections belong to the person and the animal type, not to the
     * adoption (see Adoption::preInspections), so a person with a second
     * adoption for the same type reuses the inspection they already have
     * instead of collecting a contradictory second one.
     *
     * @var array<string, array<string, array{at: CarbonImmutable, submitted: bool}>>
     */
    private array $inspections = [];

    /**
     * @param  array<string, int>  $stageWeights
     * @param  array{int, int}  $transportCapacity
     */
    public function run(
        int $count = 20,
        array $stageWeights = self::DEFAULT_STAGE_WEIGHTS,
        array $transportCapacity = [2, 5],
    ): void {
        $this->faker = Faker::create('de_DE');
        $this->faker->setDefaultTimezone('UTC');

        $this->applicants = Person::all();
        $this->mediators = Person::with('mediatorAnimalTypes')->whereHas('mediatorAnimalTypes')->get();
        $this->mediatorsByAnimalType = $this->groupByAnimalType($this->mediators, 'mediatorAnimalTypes');
        $this->inspectorsByAnimalType = $this->groupByAnimalType(
            Person::with('inspectorAnimalTypes')->whereHas('inspectorAnimalTypes')->get(),
            'inspectorAnimalTypes'
        );

        // Boarding animals are housed on behalf of their owner, not placed.
        $available = Animal::where('is_deceased', false)
            ->where('is_boarding_animal', false)
            ->get();

        $available = SeedRandom::shuffle($available);

        if ($available->isEmpty() || $this->applicants->isEmpty()) {
            return;
        }

        $transports = new TransportPool($this->faker, $this->mediators, $transportCapacity);
        $stages = $this->stageBag($stageWeights);

        // Animals whose adoption has ended. They are only taken up again once
        // the shelter has nothing else on offer — an animal that comes back is
        // rare, but it is what lets a large data set ask for more adoptions
        // than there are animals.
        $returned = collect();
        $created = 0;

        for ($i = 0; $i < $count; $i++) {
            if ($available->isEmpty()) {
                if ($returned->isEmpty()) {
                    break;
                }

                $available = SeedRandom::shuffle($returned);
                $returned = collect();
            }

            $stage = $this->faker->randomElement($stages);
            $animal = $available->shift();

            $stage = $this->createAdoption($animal, $stage, $transports);
            $created++;

            // A canceled adoption puts the animal straight back on the list;
            // a completed one only returns it to the back of the queue. An
            // adoption still running keeps the animal for good.
            match ($stage->adoptionStatus()) {
                'canceled' => $available->push($animal),
                'done' => $returned->push($animal),
                default => null,
            };
        }

        if ($created < $count) {
            $this->command?->warn(
                "Only {$created} of {$count} adoptions could be seeded — not enough animals available to place them."
            );
        }
    }

    /**
     * @return AdoptionStage the stage that was actually used, which can be an
     *                       earlier one than requested when the applicant's
     *                       inspection has not come back yet
     */
    private function createAdoption(Animal $animal, AdoptionStage $stage, TransportPool $transports): AdoptionStage
    {
        $mediator = $this->mediatorFor($animal, $stage);
        $applicant = $this->applicantFor($mediator, $animal->animal_type_id);

        $existing = $this->inspections[$applicant->id][$animal->animal_type_id] ?? null;

        // The applicant's inspection is still out, so this adoption cannot
        // have got past the inspection step either.
        if ($existing !== null && ! $existing['submitted'] && $stage->preInspectionVerdict() !== null) {
            $stage = AdoptionStage::InReview;
        }

        // Nothing may predate the animal's intake, the end of its previous
        // adoption, or an inspection this applicant already went through.
        $notBefore = $this->latest(
            CarbonImmutable::instance($animal->intake_date ?? Carbon::now()->subYear()),
            $this->availableFrom[$animal->id] ?? null,
            $existing['at'] ?? null,
        );

        $timeline = AdoptionTimeline::build($stage, $notBefore, $this->faker);

        $transport = $this->transportFor($stage, $timeline, $transports);

        $adoption = new Adoption([
            'animal_id' => $animal->id,
            'applicant_id' => $applicant->id,
            'mediator_id' => $mediator?->id,
            'status' => $stage->adoptionStatus(),
            'notes' => $this->faker->boolean(70) ? $this->faker->sentence(8) : '',
            'pre_inspection_notes' => $stage->hasPreInspection() && $this->faker->boolean(70)
                ? $this->faker->paragraph(2)
                : '',
            'contract_signed' => $stage->hasContract(),
            'contract_signed_at' => $timeline->contractSignedAt,
            'transport_id' => $transport?->id,
            'handed_over_at' => $timeline->handedOverAt,
            'canceled_at' => $timeline->canceledAt,
            'canceled_reason' => $timeline->canceledAt !== null ? $this->faker->sentence(10) : '',
        ]);

        // Eloquent leaves the timestamps alone when they are already set, so
        // the adoption is filed on the day the application arrived.
        $adoption->created_at = $timeline->appliedAt;
        $adoption->updated_at = $timeline->lastEventAt();
        $adoption->save();

        if ($stage->hasPreInspection() && $existing === null) {
            $this->createPreInspection($animal, $applicant, $stage, $timeline);
        }

        $this->applyPlacementState($animal, $applicant, $stage, $timeline);

        return $stage;
    }

    /**
     * The latest of the given moments, ignoring the ones that do not apply.
     */
    private function latest(CarbonImmutable $base, ?CarbonImmutable ...$others): CarbonImmutable
    {
        foreach ($others as $other) {
            if ($other !== null && $other->greaterThan($base)) {
                $base = $other;
            }
        }

        return $base;
    }

    private function createPreInspection(
        Animal $animal,
        Person $applicant,
        AdoptionStage $stage,
        AdoptionTimeline $timeline,
    ): void {
        // Nobody inspects their own home.
        $eligible = $this->inspectorsByAnimalType->get($animal->animal_type_id)
            ?->reject(fn (Person $person) => $person->id === $applicant->id);

        $verdict = $stage->preInspectionVerdict();

        $inspection = new PreInspection([
            'person_id' => $applicant->id,
            'animal_type_id' => $animal->animal_type_id,
            'notes' => $verdict !== null ? $this->faker->paragraph(2) : '',
        ]);

        $inspection->inspector_id = $eligible !== null ? SeedRandom::pick($eligible)?->id : null;
        $inspection->verdict = $verdict ?? 'pending';
        $inspection->submitted_at = $timeline->inspectionSubmittedAt;
        $inspection->created_at = $timeline->inspectionCreatedAt;
        $inspection->updated_at = $timeline->inspectionSubmittedAt ?? $timeline->inspectionCreatedAt;
        $inspection->save();

        $this->inspections[$applicant->id][$animal->animal_type_id] = [
            'at' => $timeline->inspectionSubmittedAt ?? $timeline->inspectionCreatedAt,
            'submitted' => $verdict !== null,
        ];

        if ($verdict !== null) {
            $this->inspectedByType[$animal->animal_type_id][] = $applicant;
        }

        // An inspection still out with the inspector needs a link they can open.
        if ($verdict === null) {
            $inspection->issueToken(Carbon::now()->addDays(30));
        }
    }

    /**
     * Mirrors the adoption onto the animal, so the animal list and the
     * adoption agree on who holds it.
     *
     * Adoptions are generated in order per animal — every later one starts
     * after the previous ended — so the most recent one always has the last
     * word here.
     */
    private function applyPlacementState(
        Animal $animal,
        Person $applicant,
        AdoptionStage $stage,
        AdoptionTimeline $timeline,
    ): void {
        $animal->is_reserved = $stage->reservesAnimal();
        $animal->owner_id = $stage->isHandedOver() ? $applicant->id : null;

        // An animal that is spoken for comes off the public listing; one whose
        // adoption fell through keeps whatever it had.
        if ($stage->reservesAnimal() || $stage->isHandedOver()) {
            $animal->do_publish = false;
        }

        $animal->save();

        $endedAt = $stage->isHandedOver() ? $timeline->handedOverAt : $timeline->canceledAt;

        if ($endedAt !== null) {
            $this->availableFrom[$animal->id] = $endedAt;
        }
    }

    private function transportFor(AdoptionStage $stage, AdoptionTimeline $timeline, TransportPool $transports): ?Transport
    {
        return match ($stage->transport()) {
            TransportState::Open => $transports->openRun(),
            TransportState::Done => $transports->completedRunFor(...$timeline->transportWindow()),
            TransportState::None => null,
        };
    }

    /**
     * Prefers a mediator who actually handles this animal's type. A pending
     * application may still be unassigned — nobody has picked it up yet.
     */
    private function mediatorFor(Animal $animal, AdoptionStage $stage): ?Person
    {
        if ($this->mediators->isEmpty()) {
            return null;
        }

        if ($stage === AdoptionStage::Applied && $this->faker->boolean(40)) {
            return null;
        }

        $qualified = $this->mediatorsByAnimalType->get($animal->animal_type_id);

        return SeedRandom::pick($qualified?->isNotEmpty() ? $qualified : $this->mediators);
    }

    /**
     * Nobody mediates their own adoption, and an applicant is preferred who
     * has not applied for this animal type before — their pre-inspection would
     * otherwise be shared between two adoptions.
     */
    private function applicantFor(?Person $mediator, string $animalTypeId): Person
    {
        $this->unseenByType[$animalTypeId] ??= SeedRandom::shuffle($this->applicants)->all();

        $passedOver = [];

        while ($this->unseenByType[$animalTypeId] !== []) {
            $person = array_pop($this->unseenByType[$animalTypeId]);

            if ($mediator !== null && $person->id === $mediator->id) {
                $passedOver[] = $person;

                continue;
            }

            array_push($this->unseenByType[$animalTypeId], ...$passedOver);

            return $person;
        }

        array_push($this->unseenByType[$animalTypeId], ...$passedOver);

        // Everyone has applied for this type before. Prefer someone whose
        // inspection is finished, since that one fits any later step.
        return $this->pickExcept($this->inspectedByType[$animalTypeId] ?? [], $mediator)
            ?? $this->pickExcept($this->applicants->all(), $mediator)
            ?? $this->applicants->first();
    }

    /**
     * @param  list<Person>  $people
     */
    private function pickExcept(array $people, ?Person $mediator): ?Person
    {
        if ($people === []) {
            return null;
        }

        $person = $people[mt_rand(0, count($people) - 1)];

        if ($mediator !== null && $person->id === $mediator->id) {
            return count($people) > 1 ? $this->pickExcept(
                array_values(array_filter($people, fn (Person $other) => $other->id !== $mediator->id)),
                $mediator
            ) : null;
        }

        return $person;
    }

    /**
     * Indexes people by the animal types they hold a role for, so picking a
     * qualified one is a lookup rather than a scan of everybody.
     *
     * @param  Collection<int, Person>  $people
     * @return Collection<string, Collection<int, Person>>
     */
    private function groupByAnimalType(Collection $people, string $relation): Collection
    {
        return $people
            ->flatMap(fn (Person $person) => $person->{$relation}->map(
                fn ($animalType) => ['animal_type_id' => $animalType->id, 'person' => $person]
            ))
            ->groupBy('animal_type_id')
            ->map(fn (Collection $rows) => $rows->pluck('person'));
    }

    /**
     * Expands the weights into a flat list the faker can draw from.
     *
     * @param  array<string, int>  $weights
     * @return list<AdoptionStage>
     */
    private function stageBag(array $weights): array
    {
        $bag = [];

        foreach ($weights as $stage => $weight) {
            $case = AdoptionStage::tryFrom($stage);

            if ($case === null) {
                continue;
            }

            $bag = array_merge($bag, array_fill(0, max(0, $weight), $case));
        }

        return $bag !== [] ? $bag : AdoptionStage::cases();
    }
}
