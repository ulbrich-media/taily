<?php

namespace Taily\Services;

use Taily\Models\Animal;
use Taily\Models\AnimalTrait;

class AnimalTraitService
{
    /**
     * Sync traits of a given type for an animal, adding new values and removing deleted ones.
     *
     * @param  string[]  $newValues
     */
    public static function sync(Animal $animal, string $type, array $newValues): void
    {
        $currentValues = $animal->traits()
            ->where('type', $type)
            ->pluck('value')
            ->all();

        $toAdd = array_diff($newValues, $currentValues);
        $toRemove = array_diff($currentValues, $newValues);

        if ($toRemove) {
            $animal->traits()
                ->where('type', $type)
                ->whereIn('value', $toRemove)
                ->delete();
        }

        foreach ($toAdd as $val) {
            $animal->traits()->create(['type' => $type, 'value' => $val]);
        }
    }

    /**
     * Return distinct sorted trait values of a given type for an animal type.
     *
     * @return string[]
     */
    public static function suggestions(string $animalTypeId, string $type): array
    {
        return AnimalTrait::whereHas(
            'animal',
            fn ($q) => $q->where('animal_type_id', $animalTypeId)
        )
            ->where('type', $type)
            ->distinct()
            ->orderBy('value')
            ->pluck('value')
            ->all();
    }
}
