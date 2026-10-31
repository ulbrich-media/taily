<?php

namespace Taily\Support\CustomFields;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Taily\Models\CustomFieldGroup;

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

            if (! $replacement || $replacement->type() !== $old->type()) {
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
        $path = "custom_fields->{$removal->key}";

        return $removal->option === null
            ? $model::query()->whereNotNull($path)
            : $model::query()->where($path, $removal->option);
    }
}
