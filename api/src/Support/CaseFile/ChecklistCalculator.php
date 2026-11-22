<?php

namespace Taily\Support\CaseFile;

use Taily\Enums\AdoptionStep;
use Taily\Enums\FieldType;

/**
 * Derives what a step of an adoption needs (docs/features/case-file.md#checklist).
 *
 * Pure logic over plain values, so every rule — carry-forward of earlier
 * steps, overrides, conditions, contract fields, review — is unit-testable
 * without a database.
 */
final class ChecklistCalculator
{
    /** @var array<string, FieldSpec> */
    private array $specs = [];

    /**
     * @param  list<FieldSpec>  $specs
     */
    public function __construct(array $specs)
    {
        foreach ($specs as $spec) {
            $this->specs[$spec->key] = $spec;
        }
    }

    public function forStep(CaseFileState $state, AdoptionStep $step): Checklist
    {
        $items = [];

        foreach ($this->specs as $spec) {
            if (! $spec->type->holdsValue()) {
                continue;
            }

            $requiredFor = $this->effectiveRequiredFor($spec, $state);

            if ($requiredFor === null || ! $requiredFor->isAtOrBefore($step)) {
                continue;
            }

            $items[] = new ChecklistItem($spec->key, $spec->label, $requiredFor, $this->status($spec, $state));
        }

        return new Checklist($step, $items);
    }

    /**
     * The step from which the field is required for this adoption, or null
     * when it is optional or doesn't apply.
     */
    public function effectiveRequiredFor(FieldSpec $spec, CaseFileState $state): ?AdoptionStep
    {
        if (! $this->applies($spec, $state)) {
            return null;
        }

        $override = $state->overrides[$spec->key] ?? null;
        $contract = in_array($spec->key, $state->contractFieldKeys, true) ? AdoptionStep::CONTRACT : null;

        $requiredFor = $override !== null
            ? ($override->waived ? null : $override->requiredFor)
            : AdoptionStep::earliest($spec->requiredFor, $contract);

        // A field every contract prints stays required for it, whatever the override.
        if ($contract !== null && in_array($spec->key, $state->lockedContractKeys, true)) {
            return AdoptionStep::earliest($requiredFor, $contract);
        }

        return $requiredFor;
    }

    /**
     * A field applies when it is meant for the animal's type and its
     * condition — if any — is met. A field whose controlling field doesn't
     * apply doesn't apply either.
     *
     * @param  array<string, true>  $visited  guards against misconfigured cycles
     */
    public function applies(FieldSpec $spec, CaseFileState $state, array $visited = []): bool
    {
        if ($spec->animalTypeIds !== [] && ! in_array($state->animalTypeId, $spec->animalTypeIds, true)) {
            return false;
        }

        if ($spec->condition === null) {
            return true;
        }

        $controller = $this->specs[$spec->condition['field']] ?? null;

        if ($controller === null || isset($visited[$spec->key])) {
            return false;
        }

        if (! $this->applies($controller, $state, $visited + [$spec->key => true])) {
            return false;
        }

        $value = $state->value($controller->key);

        if (array_key_exists('in', $spec->condition)) {
            return in_array($value, $spec->condition['in'], true);
        }

        return array_key_exists('equals', $spec->condition) && $value === $spec->condition['equals'];
    }

    public static function isPresent(FieldType $type, mixed $value): bool
    {
        if ($value === null) {
            return false;
        }

        if ($type === FieldType::ADDRESS) {
            return is_array($value)
                && trim((string) ($value['street_line'] ?? '')) !== ''
                && trim((string) ($value['postal_code'] ?? '')) !== ''
                && trim((string) ($value['city'] ?? '')) !== '';
        }

        if (is_string($value)) {
            return trim($value) !== '';
        }

        if (is_array($value)) {
            return $value !== [];
        }

        // Booleans and numbers are answers, including false and 0.
        return true;
    }

    private function status(FieldSpec $spec, CaseFileState $state): string
    {
        if (! self::isPresent($spec->type, $state->value($spec->key))) {
            return ChecklistItem::MISSING;
        }

        if (! $spec->requiresReview) {
            return ChecklistItem::DONE;
        }

        return match ($state->reviewStatuses[$spec->key] ?? null) {
            'confirmed' => ChecklistItem::DONE,
            'rejected' => ChecklistItem::MISSING,
            default => ChecklistItem::AWAITING_REVIEW,
        };
    }
}
