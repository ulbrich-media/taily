<?php

namespace Taily\Support\CaseFile;

use Taily\Enums\AdoptionStep;
use Taily\Enums\FieldType;
use Taily\Models\Adoption;

/**
 * The built-in animal and mediator fields a contract template can print
 * (ADR-016, "The field registry"). Adopter fields are not listed here: they
 * are Field Definitions of the catalogue, built-in or custom.
 */
final class ContractFieldRegistry
{
    /** @var array<string, array{label: string, type: FieldType}> */
    private const FIELDS = [
        'animal.name' => ['label' => 'Name des Tieres', 'type' => FieldType::TEXT],
        'animal.breed' => ['label' => 'Rasse des Tieres', 'type' => FieldType::TEXT],
        'animal.color' => ['label' => 'Farbe des Tieres', 'type' => FieldType::TEXT],
        'animal.date_of_birth' => ['label' => 'Geburtsdatum des Tieres', 'type' => FieldType::DATE],
        'animal.animal_number' => ['label' => 'Tiernummer', 'type' => FieldType::TEXT],
        'animal.tasso_id' => ['label' => 'Tasso-ID des Tieres', 'type' => FieldType::TEXT],
        'animal.findefix_id' => ['label' => 'Findefix-ID des Tieres', 'type' => FieldType::TEXT],
        'mediator.full_name' => ['label' => 'Vermittler:in', 'type' => FieldType::TEXT],
        'mediator.email' => ['label' => 'E-Mail der Vermittler:in', 'type' => FieldType::EMAIL],
        'mediator.phone' => ['label' => 'Telefon der Vermittler:in', 'type' => FieldType::PHONE],
    ];

    public static function has(string $key): bool
    {
        return array_key_exists($key, self::FIELDS);
    }

    public static function spec(string $key): FieldSpec
    {
        $field = self::FIELDS[$key];

        return new FieldSpec($key, $field['label'], $field['type'], AdoptionStep::CONTRACT, AdoptionStep::CONTRACT);
    }

    /**
     * Where to fix a missing value: on the animal or on the mediator.
     */
    public static function subject(string $key): string
    {
        return str_starts_with($key, 'animal.') ? 'animal' : 'mediator';
    }

    public static function value(string $key, Adoption $adoption): mixed
    {
        [$subject, $attribute] = explode('.', $key, 2);

        $model = $subject === 'animal' ? $adoption->animal : $adoption->mediator;

        if ($model === null) {
            return null;
        }

        $value = $model->{$attribute};

        return $value instanceof \DateTimeInterface ? $value->format('Y-m-d') : $value;
    }
}
