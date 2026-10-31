<?php

namespace Taily\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Taily\Enums\CustomFieldEntity;
use Taily\Support\CustomFields\CustomFieldDefinition;
use Taily\Support\CustomFields\CustomFieldDefinitions;

/**
 * Binds one Form Template to an entity, a section of its UI and a scope
 * (animal types or person roles). See docs/features/custom-fields.md.
 */
class CustomFieldGroup extends Model
{
    use HasUuids;

    protected $fillable = [
        'entity',
        'section',
        'person_roles',
        'form_template_id',
        'title',
        'position',
        'field_settings',
    ];

    protected $attributes = [
        'person_roles' => '[]',
        'field_settings' => '{}',
        'position' => 0,
    ];

    protected function casts(): array
    {
        return [
            'entity' => CustomFieldEntity::class,
            'person_roles' => 'array',
            'field_settings' => 'array',
            'position' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        // Definitions are memoized per request; any change to a group must be
        // visible to the rest of the same request (and to tests).
        $flush = fn () => app(CustomFieldDefinitions::class)->flush();
        static::saved($flush);
        static::deleted($flush);
    }

    public function formTemplate(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class);
    }

    public function animalTypes(): BelongsToMany
    {
        return $this->belongsToMany(AnimalType::class, 'custom_field_group_animal_type');
    }

    /**
     * The fields of the bound template's latest version, in display order.
     * Headings carry no data and are not part of the result.
     *
     * @return list<CustomFieldDefinition>
     */
    public function fieldDefinitions(): array
    {
        $version = $this->formTemplate?->latestVersion;

        return $version
            ? CustomFieldDefinition::fromSchema($this, $version->schema ?? [], $version->ui_schema ?? [])
            : [];
    }

    /**
     * @return list<string>
     */
    public function keys(): array
    {
        return array_map(fn (CustomFieldDefinition $field) => $field->key, $this->fieldDefinitions());
    }

    /**
     * Whether the group applies to a record with the given scope: the
     * animal's type, or the person's roles. An empty scope means everyone.
     *
     * @param  list<string>  $personRoles
     */
    public function isInScope(?string $animalTypeId, array $personRoles = []): bool
    {
        if ($this->entity === CustomFieldEntity::ANIMAL) {
            $typeIds = $this->animalTypes->pluck('id')->all();

            return $typeIds === [] || in_array($animalTypeId, $typeIds, true);
        }

        $roles = $this->person_roles ?? [];

        return $roles === [] || array_intersect($roles, $personRoles) !== [];
    }

    public function isPublic(string $key): bool
    {
        return (bool) ($this->field_settings[$key]['public'] ?? false);
    }
}
