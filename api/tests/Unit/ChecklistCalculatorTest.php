<?php

namespace Taily\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Taily\Enums\AdoptionStep;
use Taily\Enums\FieldType;
use Taily\Support\CaseFile\CaseFileState;
use Taily\Support\CaseFile\ChecklistCalculator;
use Taily\Support\CaseFile\ChecklistItem;
use Taily\Support\CaseFile\FieldSpec;
use Taily\Support\CaseFile\Override;

class ChecklistCalculatorTest extends TestCase
{
    private const DOG = 'dog-type';

    private const CAT = 'cat-type';

    public function test_a_field_required_for_an_earlier_step_stays_required_later(): void
    {
        $calculator = new ChecklistCalculator([
            $this->field('living_space', AdoptionStep::APPLICATION),
            $this->field('id_card_number', AdoptionStep::CONTRACT),
        ]);

        $state = new CaseFileState(self::DOG);

        $this->assertSame(['living_space'], $this->keys($calculator, $state, AdoptionStep::APPLICATION));
        $this->assertSame(['living_space'], $this->keys($calculator, $state, AdoptionStep::PRE_INSPECTION));
        $this->assertSame(['living_space', 'id_card_number'], $this->keys($calculator, $state, AdoptionStep::TRANSPORT));
    }

    public function test_optional_fields_and_info_blocks_are_never_on_the_checklist(): void
    {
        $calculator = new ChecklistCalculator([
            $this->field('home_video', null, FieldType::VIDEO),
            $this->field('harness_hint', AdoptionStep::TRANSPORT, FieldType::INFO),
        ]);

        $this->assertSame([], $this->keys($calculator, new CaseFileState(self::DOG), AdoptionStep::HANDOVER));
    }

    public function test_items_are_missing_until_a_value_is_present(): void
    {
        $calculator = new ChecklistCalculator([
            $this->field('living_space', AdoptionStep::APPLICATION, FieldType::INTEGER),
            $this->field('landlord_agrees', AdoptionStep::APPLICATION, FieldType::BOOLEAN),
            $this->field('experience', AdoptionStep::APPLICATION, FieldType::TEXTAREA),
        ]);

        $checklist = $calculator->forStep(new CaseFileState(self::DOG, [
            'living_space' => 0,
            'landlord_agrees' => false,
            'experience' => '   ',
        ]), AdoptionStep::APPLICATION);

        // 0 and false are answers; whitespace is not.
        $this->assertSame(
            ['living_space' => 'done', 'landlord_agrees' => 'done', 'experience' => 'missing'],
            $this->statuses($checklist->items),
        );
        $this->assertFalse($checklist->isComplete());
        $this->assertSame(1, $checklist->count(ChecklistItem::MISSING));
    }

    public function test_an_address_needs_street_postal_code_and_city(): void
    {
        $calculator = new ChecklistCalculator([$this->field('address', AdoptionStep::CONTRACT, FieldType::ADDRESS)]);

        $partial = new CaseFileState(self::DOG, ['address' => ['street_line' => 'Hauptstr. 1', 'postal_code' => '', 'city' => 'Köln']]);
        $full = new CaseFileState(self::DOG, ['address' => ['street_line' => 'Hauptstr. 1', 'postal_code' => '50667', 'city' => 'Köln']]);

        $this->assertSame('missing', $calculator->forStep($partial, AdoptionStep::CONTRACT)->items[0]->status);
        $this->assertSame('done', $calculator->forStep($full, AdoptionStep::CONTRACT)->items[0]->status);
    }

    public function test_reviewed_fields_only_count_once_confirmed(): void
    {
        $calculator = new ChecklistCalculator([
            $this->field('harness_photo', AdoptionStep::TRANSPORT, FieldType::PHOTO, requiresReview: true),
        ]);

        $status = fn (?string $review) => $calculator->forStep(
            new CaseFileState(self::DOG, ['harness_photo' => ['photo.jpg']], ['harness_photo' => $review]),
            AdoptionStep::TRANSPORT,
        )->items[0]->status;

        $this->assertSame('awaiting_review', $status(null));
        $this->assertSame('awaiting_review', $status('pending'));
        $this->assertSame('done', $status('confirmed'));
        $this->assertSame('missing', $status('rejected'));
    }

    public function test_fields_for_another_animal_type_do_not_apply(): void
    {
        $calculator = new ChecklistCalculator([
            $this->field('harness_photo', AdoptionStep::TRANSPORT, animalTypeIds: [self::DOG]),
            $this->field('carrier_photo', AdoptionStep::TRANSPORT, animalTypeIds: [self::CAT]),
        ]);

        $this->assertSame(['harness_photo'], $this->keys($calculator, new CaseFileState(self::DOG), AdoptionStep::TRANSPORT));
        $this->assertSame(['carrier_photo'], $this->keys($calculator, new CaseFileState(self::CAT), AdoptionStep::TRANSPORT));
    }

    public function test_an_override_can_require_waive_or_move_a_field(): void
    {
        $calculator = new ChecklistCalculator([
            $this->field('home_video', null, FieldType::VIDEO),
            $this->field('landlord_confirmation', AdoptionStep::PRE_INSPECTION, FieldType::DOCUMENT),
            $this->field('id_card_number', AdoptionStep::CONTRACT),
        ]);

        $state = new CaseFileState(self::DOG, overrides: [
            'home_video' => new Override(AdoptionStep::PRE_INSPECTION),
            'landlord_confirmation' => new Override(null, waived: true),
            'id_card_number' => new Override(AdoptionStep::TRANSPORT),
        ]);

        $this->assertSame(['home_video'], $this->keys($calculator, $state, AdoptionStep::CONTRACT));
        $this->assertSame(['home_video', 'id_card_number'], $this->keys($calculator, $state, AdoptionStep::TRANSPORT));
    }

    public function test_an_override_to_null_makes_a_required_field_optional(): void
    {
        $calculator = new ChecklistCalculator([$this->field('id_card_number', AdoptionStep::CONTRACT)]);

        $state = new CaseFileState(self::DOG, overrides: ['id_card_number' => new Override(null)]);

        $this->assertSame([], $this->keys($calculator, $state, AdoptionStep::HANDOVER));
    }

    public function test_contract_fields_are_required_for_the_contract_step(): void
    {
        $calculator = new ChecklistCalculator([
            $this->field('date_of_birth', null, FieldType::DATE),
            $this->field('living_space', AdoptionStep::APPLICATION),
            $this->field('animal.tasso_id', AdoptionStep::CONTRACT),
        ]);

        $state = new CaseFileState(self::DOG, contractFieldKeys: ['date_of_birth', 'living_space']);

        $this->assertSame(['living_space'], $this->keys($calculator, $state, AdoptionStep::PRE_INSPECTION));
        $this->assertSame(
            ['date_of_birth' => 'contract', 'living_space' => 'application', 'animal.tasso_id' => 'contract'],
            $this->requiredFor($calculator->forStep($state, AdoptionStep::CONTRACT)->items),
        );
    }

    public function test_an_override_beats_the_contract_requirement(): void
    {
        $calculator = new ChecklistCalculator([$this->field('id_card_number', null)]);

        $state = new CaseFileState(self::DOG, overrides: ['id_card_number' => new Override(null, waived: true)], contractFieldKeys: ['id_card_number']);

        $this->assertSame([], $this->keys($calculator, $state, AdoptionStep::CONTRACT));
    }

    public function test_a_field_every_contract_prints_stays_required_for_the_contract_despite_an_override(): void
    {
        $calculator = new ChecklistCalculator([$this->field('address', null, FieldType::ADDRESS)]);
        $locked = fn (Override $override) => new CaseFileState(self::DOG, overrides: ['address' => $override], contractFieldKeys: ['address'], lockedContractKeys: ['address']);

        $this->assertSame(['address'], $this->keys($calculator, $locked(new Override(null, waived: true)), AdoptionStep::CONTRACT));
        $this->assertSame(['address'], $this->keys($calculator, $locked(new Override(AdoptionStep::TRANSPORT)), AdoptionStep::CONTRACT));
        // An earlier step still applies.
        $this->assertSame(['address'], $this->keys($calculator, $locked(new Override(AdoptionStep::PRE_INSPECTION)), AdoptionStep::PRE_INSPECTION));
    }

    public function test_a_conditional_field_only_applies_when_its_condition_is_met(): void
    {
        $calculator = new ChecklistCalculator([
            $this->field('has_garden', AdoptionStep::APPLICATION, FieldType::BOOLEAN),
            $this->field('garden_size', AdoptionStep::APPLICATION, FieldType::INTEGER, condition: ['field' => 'has_garden', 'equals' => true]),
        ]);

        $this->assertSame(['has_garden'], $this->keys($calculator, new CaseFileState(self::DOG), AdoptionStep::APPLICATION));
        $this->assertSame(['has_garden'], $this->keys($calculator, new CaseFileState(self::DOG, ['has_garden' => false]), AdoptionStep::APPLICATION));
        $this->assertSame(['has_garden', 'garden_size'], $this->keys($calculator, new CaseFileState(self::DOG, ['has_garden' => true]), AdoptionStep::APPLICATION));
    }

    public function test_a_condition_can_match_one_of_several_values(): void
    {
        $calculator = new ChecklistCalculator([
            $this->field('housing_type', AdoptionStep::APPLICATION, FieldType::SELECT),
            $this->field('landlord_agrees', AdoptionStep::APPLICATION, FieldType::BOOLEAN, condition: ['field' => 'housing_type', 'in' => ['apartment', 'rented_house']]),
        ]);

        $keys = fn (string $housing) => $this->keys($calculator, new CaseFileState(self::DOG, ['housing_type' => $housing]), AdoptionStep::APPLICATION);

        $this->assertSame(['housing_type', 'landlord_agrees'], $keys('apartment'));
        $this->assertSame(['housing_type'], $keys('own_house'));
    }

    public function test_a_field_depending_on_a_field_that_does_not_apply_does_not_apply(): void
    {
        $calculator = new ChecklistCalculator([
            $this->field('has_garden', AdoptionStep::APPLICATION, FieldType::BOOLEAN),
            $this->field('garden_fenced', AdoptionStep::APPLICATION, FieldType::BOOLEAN, condition: ['field' => 'has_garden', 'equals' => true]),
            $this->field('fence_height', AdoptionStep::APPLICATION, FieldType::INTEGER, condition: ['field' => 'garden_fenced', 'equals' => true]),
        ]);

        // A stale "fenced" answer from before the garden was gone doesn't
        // keep the fence height required.
        $state = new CaseFileState(self::DOG, ['has_garden' => false, 'garden_fenced' => true]);

        $this->assertSame(['has_garden'], $this->keys($calculator, $state, AdoptionStep::APPLICATION));
    }

    public function test_an_override_cannot_make_a_non_applying_field_required(): void
    {
        $calculator = new ChecklistCalculator([
            $this->field('has_garden', AdoptionStep::APPLICATION, FieldType::BOOLEAN),
            $this->field('garden_size', null, FieldType::INTEGER, condition: ['field' => 'has_garden', 'equals' => true]),
        ]);

        $state = new CaseFileState(self::DOG, ['has_garden' => false], overrides: ['garden_size' => new Override(AdoptionStep::APPLICATION)]);

        $this->assertSame(['has_garden'], $this->keys($calculator, $state, AdoptionStep::APPLICATION));
    }

    public function test_a_condition_on_an_unknown_field_or_a_cycle_does_not_apply(): void
    {
        $calculator = new ChecklistCalculator([
            $this->field('orphan', AdoptionStep::APPLICATION, condition: ['field' => 'archived', 'equals' => true]),
            $this->field('a', AdoptionStep::APPLICATION, FieldType::BOOLEAN, condition: ['field' => 'b', 'equals' => true]),
            $this->field('b', AdoptionStep::APPLICATION, FieldType::BOOLEAN, condition: ['field' => 'a', 'equals' => true]),
        ]);

        $state = new CaseFileState(self::DOG, ['a' => true, 'b' => true]);

        $this->assertSame([], $this->keys($calculator, $state, AdoptionStep::APPLICATION));
    }

    /**
     * @param  list<string>  $animalTypeIds
     * @param  array<string, mixed>|null  $condition
     */
    private function field(
        string $key,
        ?AdoptionStep $requiredFor,
        FieldType $type = FieldType::TEXT,
        bool $requiresReview = false,
        array $animalTypeIds = [],
        ?array $condition = null,
    ): FieldSpec {
        return new FieldSpec($key, ucfirst($key), $type, AdoptionStep::APPLICATION, $requiredFor, $requiresReview, $animalTypeIds, $condition);
    }

    /**
     * @return list<string>
     */
    private function keys(ChecklistCalculator $calculator, CaseFileState $state, AdoptionStep $step): array
    {
        return array_map(fn (ChecklistItem $item) => $item->key, $calculator->forStep($state, $step)->items);
    }

    /**
     * @param  list<ChecklistItem>  $items
     * @return array<string, string>
     */
    private function statuses(array $items): array
    {
        return array_combine(array_map(fn ($item) => $item->key, $items), array_map(fn ($item) => $item->status, $items));
    }

    /**
     * @param  list<ChecklistItem>  $items
     * @return array<string, string>
     */
    private function requiredFor(array $items): array
    {
        return array_combine(array_map(fn ($item) => $item->key, $items), array_map(fn ($item) => $item->requiredFor->value, $items));
    }
}
