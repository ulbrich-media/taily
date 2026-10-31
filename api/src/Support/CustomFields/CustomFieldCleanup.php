<?php

namespace Taily\Support\CustomFields;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Taily\Models\CustomFieldGroup;
use Taily\Support\JsonSchemaValidator;

/**
 * Deletes the values of custom field definitions that go away: a removed
 * field, a removed option, a changed field type, a deleted group. See
 * "Removing values" in docs/features/custom-fields.md.
 *
 * Impacts are computed by the same code that performs the deletion, so the
 * confirmation dialog always shows exactly what will happen.
 */
class CustomFieldCleanup
{
    /** Request flag that confirms a save deleting values. */
    public const CONFIRM_FLAG = 'confirm_custom_field_removal';

    public function __construct(private JsonSchemaValidator $validator) {}

    /**
     * The impact of replacing the schema of a template bound to `$group`.
     *
     * @param  array<string, mixed>  $schema
     * @param  array<string, mixed>|null  $uiSchema
     * @return list<CustomFieldRemoval>
     */
    public function templateChangeImpact(CustomFieldGroup $group, array $schema, ?array $uiSchema): array
    {
        $new = collect(CustomFieldDefinition::fromSchema($group, $schema, $uiSchema ?? []))->keyBy('key');
        $removals = [];

        foreach ($group->fieldDefinitions() as $old) {
            $replacement = $new->get($old->key);

            // Only a change of the stored value's kind deletes. Text to
            // textarea or select to radio keeps the values.
            if (! $replacement || $replacement->valueKind() !== $old->valueKind()) {
                $removals[] = new CustomFieldRemoval($group->entity, $old->key, $old->label(), null);

                continue;
            }

            $kept = array_column($replacement->options(), 'value');
            foreach ($old->options() as $option) {
                if (! in_array($option['value'], $kept, true)) {
                    $removals[] = new CustomFieldRemoval($group->entity, $old->key, $old->label(), $option['value']);
                }
            }
        }

        return $this->withCounts($removals);
    }

    /**
     * Fields kept by replacing the schema of a template bound to `$group`
     * whose stored values no longer pass the new rules (a lower maximum
     * length, a new date format, …), with the number of records affected.
     * Such values are kept, see "Changing a field" in the feature doc.
     *
     * @param  array<string, mixed>  $schema
     * @param  array<string, mixed>|null  $uiSchema
     * @return list<array{key: string, label: string, count: int}>
     */
    public function invalidValues(CustomFieldGroup $group, array $schema, ?array $uiSchema): array
    {
        $old = collect($group->fieldDefinitions())->keyBy('key');
        $invalid = [];

        foreach (CustomFieldDefinition::fromSchema($group, $schema, $uiSchema ?? []) as $field) {
            $previous = $old->get($field->key);

            // New fields have no values. Removed options and changed kinds
            // delete their values instead, see templateChangeImpact().
            if (! $previous
                || $previous->schema == $field->schema
                || $previous->valueKind() !== $field->valueKind()
                || $field->valueKind() === 'option') {
                continue;
            }

            $count = 0;
            $model = $group->entity->modelClass();
            $model::query()->whereNotNull(CustomFieldKeys::jsonPath($field->key))
                ->chunkById(200, function ($records) use ($field, &$count) {
                    foreach ($records as $record) {
                        $value = ($record->custom_fields ?? [])[$field->key] ?? null;

                        if (! $this->validator->validate(
                            ['type' => 'object', 'properties' => [$field->key => $field->schema]],
                            [$field->key => $value],
                        )['valid']) {
                            $count++;
                        }
                    }
                });

            if ($count > 0) {
                $invalid[] = ['key' => $field->key, 'label' => $field->label(), 'count' => $count];
            }
        }

        return $invalid;
    }

    /**
     * @return list<CustomFieldRemoval>
     */
    public function groupDeletionImpact(CustomFieldGroup $group): array
    {
        return $this->withCounts(array_map(
            fn (CustomFieldDefinition $field) => new CustomFieldRemoval($group->entity, $field->key, $field->label(), null),
            $group->fieldDefinitions(),
        ));
    }

    /**
     * Delete the values. Runs inside the caller's transaction.
     *
     * @param  list<CustomFieldRemoval>  $removals
     */
    public function remove(array $removals): void
    {
        foreach ($removals as $removal) {
            $this->query($removal)->chunkById(200, function ($records) use ($removal) {
                foreach ($records as $record) {
                    $values = $record->custom_fields ?? [];
                    unset($values[$removal->key]);

                    // Not a user edit, so updated_at stays as it is.
                    $record->newQuery()->toBase()
                        ->where($record->getKeyName(), $record->getKey())
                        ->update(['custom_fields' => json_encode((object) $values)]);
                }
            });
        }
    }

    /**
     * The 409 answer for a save that would delete values without the flag.
     *
     * @param  list<CustomFieldRemoval>  $removals
     */
    public function conflictResponse(array $removals): JsonResponse
    {
        return response()->json([
            'message' => 'Durch diese Änderung werden gespeicherte Werte gelöscht. Bitte bestätigen.',
            'removal_impact' => array_map(fn (CustomFieldRemoval $removal) => $removal->toArray(), $removals),
        ], 409);
    }

    /**
     * @param  list<CustomFieldRemoval>  $removals
     * @return list<CustomFieldRemoval>
     */
    private function withCounts(array $removals): array
    {
        return array_values(array_filter(
            array_map(fn (CustomFieldRemoval $removal) => $removal->withCount($this->query($removal)->count()), $removals),
            fn (CustomFieldRemoval $removal) => $removal->count > 0,
        ));
    }

    private function query(CustomFieldRemoval $removal): Builder
    {
        $model = $removal->entity->modelClass();
        $path = CustomFieldKeys::jsonPath($removal->key);

        return $removal->option === null
            ? $model::query()->whereNotNull($path)
            : $model::query()->where($path, $removal->option);
    }
}
