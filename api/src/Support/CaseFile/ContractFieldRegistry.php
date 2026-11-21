<?php

namespace Taily\Support\CaseFile;

use Taily\Enums\AdoptionStep;
use Taily\Enums\FieldType;
use Taily\Models\Adoption;

/**
 * The built-in animal and mediator fields a contract template can print
 * (ADR-017, "The field registry"). Adopter fields are not listed here: they
 * are Field Definitions of the catalogue, built-in or custom.
 *
 * `label` names the field on checklists, where it stands next to adopter
 * fields; `print` is the shorter label under the section heading of the
 * contract.
 */
final class ContractFieldRegistry
{
    /** @var array<string, array{label: string, print: string, type: FieldType}> */
    private const FIELDS = [
        'animal.name' => ['label' => 'Name des Tieres', 'print' => 'Name', 'type' => FieldType::TEXT],
        'animal.animal_type' => ['label' => 'Tierart', 'print' => 'Tierart', 'type' => FieldType::TEXT],
        'animal.breed' => ['label' => 'Rasse des Tieres', 'print' => 'Rasse', 'type' => FieldType::TEXT],
        'animal.gender' => ['label' => 'Geschlecht des Tieres', 'print' => 'Geschlecht', 'type' => FieldType::TEXT],
        'animal.color' => ['label' => 'Farbe des Tieres', 'print' => 'Farbe', 'type' => FieldType::TEXT],
        'animal.date_of_birth' => ['label' => 'Geburtsdatum des Tieres', 'print' => 'Geburtsdatum', 'type' => FieldType::DATE],
        'animal.animal_number' => ['label' => 'Tiernummer', 'print' => 'Tiernummer', 'type' => FieldType::TEXT],
        'animal.tasso_id' => ['label' => 'Tasso-ID des Tieres', 'print' => 'Tasso-ID', 'type' => FieldType::TEXT],
        'animal.findefix_id' => ['label' => 'Findefix-ID des Tieres', 'print' => 'Findefix-ID', 'type' => FieldType::TEXT],
        'animal.contract_notes' => ['label' => 'Vertragsnotizen zum Tier', 'print' => 'Besonderheiten', 'type' => FieldType::TEXTAREA],
        'animal.photo' => ['label' => 'Foto des Tieres', 'print' => 'Foto', 'type' => FieldType::PHOTO],
        'mediator.full_name' => ['label' => 'Vermittler:in', 'print' => 'Name', 'type' => FieldType::TEXT],
        'mediator.organization' => ['label' => 'Organisation der Vermittler:in', 'print' => 'Organisation', 'type' => FieldType::TEXT],
        'mediator.email' => ['label' => 'E-Mail der Vermittler:in', 'print' => 'E-Mail', 'type' => FieldType::EMAIL],
        'mediator.phone' => ['label' => 'Telefon der Vermittler:in', 'print' => 'Telefon', 'type' => FieldType::PHONE],
    ];

    private const GENDERS = ['male' => 'männlich', 'female' => 'weiblich'];

    public static function has(string $key): bool
    {
        return array_key_exists($key, self::FIELDS);
    }

    /**
     * The registry entries of one section, for the template editor.
     *
     * @return list<array{key: string, label: string, print: string}>
     */
    public static function options(string $section): array
    {
        return collect(self::FIELDS)
            ->filter(fn (array $field, string $key) => str_starts_with($key, "{$section}."))
            ->map(fn (array $field, string $key) => ['key' => $key, 'label' => $field['label'], 'print' => $field['print']])
            ->values()
            ->all();
    }

    public static function spec(string $key): FieldSpec
    {
        $field = self::FIELDS[$key];

        return new FieldSpec($key, $field['label'], $field['type'], AdoptionStep::CONTRACT, AdoptionStep::CONTRACT);
    }

    public static function printLabel(string $key): string
    {
        return self::FIELDS[$key]['print'];
    }

    public static function type(string $key): FieldType
    {
        return self::FIELDS[$key]['type'];
    }

    /**
     * Where to fix a missing value: on the animal or on the mediator.
     */
    public static function subject(string $key): string
    {
        return str_starts_with($key, 'animal.') ? 'animal' : 'mediator';
    }

    /**
     * The raw value as the checklist sees it. Dates are Y-m-d; the photo is
     * true when the animal has a picture.
     */
    public static function value(string $key, Adoption $adoption): mixed
    {
        [$subject, $attribute] = explode('.', $key, 2);

        $model = $subject === 'animal' ? $adoption->animal : $adoption->mediator;

        if ($model === null) {
            return null;
        }

        $value = match ($key) {
            'animal.animal_type' => $model->animalType?->title,
            'animal.gender' => self::GENDERS[$model->gender] ?? $model->gender,
            'animal.photo' => $model->getMedia('pictures')->contains(fn ($media) => str_starts_with((string) $media->mime_type, 'image/')) ?: null,
            'mediator.organization' => $model->organization?->name,
            default => $model->{$attribute},
        };

        return $value instanceof \DateTimeInterface ? $value->format('Y-m-d') : $value;
    }
}
