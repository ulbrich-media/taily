<?php

namespace Taily\Support\CustomFields;

use Taily\Enums\CustomFieldEntity;

/**
 * The fields of an entity a form template may link to with a "Feld
 * übernehmen" field: a whitelist of core fields plus every custom field.
 * See "Linked fields" in docs/features/custom-fields.md.
 */
class LinkableFields
{
    /** @var array<string, array<string, array{label: string, schema: array<string, mixed>, ui?: array<string, mixed>}>> */
    private const CORE = [
        'person' => [
            'first_name' => ['label' => 'Vorname', 'schema' => ['type' => 'string', 'maxLength' => 255]],
            'last_name' => ['label' => 'Nachname', 'schema' => ['type' => 'string', 'maxLength' => 255]],
            'email' => ['label' => 'E-Mail', 'schema' => ['type' => 'string', 'format' => 'email'], 'ui' => ['ui:widget' => 'email']],
            'phone' => ['label' => 'Telefon', 'schema' => ['type' => 'string', 'format' => 'phone'], 'ui' => ['ui:widget' => 'phone']],
            'mobile' => ['label' => 'Mobil', 'schema' => ['type' => 'string', 'format' => 'phone'], 'ui' => ['ui:widget' => 'phone']],
            'date_of_birth' => ['label' => 'Geburtsdatum', 'schema' => ['type' => 'string', 'format' => 'date'], 'ui' => ['ui:widget' => 'date']],
            'street_line' => ['label' => 'Straße und Hausnummer', 'schema' => ['type' => 'string', 'maxLength' => 255]],
            'street_line_additional' => ['label' => 'Adresszusatz', 'schema' => ['type' => 'string', 'maxLength' => 255]],
            'postal_code' => ['label' => 'Postleitzahl', 'schema' => ['type' => 'string', 'maxLength' => 255]],
            'city' => ['label' => 'Ort', 'schema' => ['type' => 'string', 'maxLength' => 255]],
        ],
        'animal' => [
            'name' => ['label' => 'Name', 'schema' => ['type' => 'string', 'maxLength' => 255]],
            'breed' => ['label' => 'Rasse', 'schema' => ['type' => 'string', 'maxLength' => 255]],
            'gender' => ['label' => 'Geschlecht', 'schema' => ['type' => 'string', 'enum' => ['male', 'female']], 'ui' => ['ui:options' => ['labels' => [
                ['value' => 'male', 'label' => 'Männlich'],
                ['value' => 'female', 'label' => 'Weiblich'],
            ]]]],
            'color' => ['label' => 'Farbe', 'schema' => ['type' => 'string', 'maxLength' => 255]],
            'date_of_birth' => ['label' => 'Geburtsdatum', 'schema' => ['type' => 'string', 'format' => 'date'], 'ui' => ['ui:widget' => 'date']],
            'origin_country' => ['label' => 'Herkunftsland', 'schema' => ['type' => 'string', 'maxLength' => 255]],
        ],
    ];

    public function __construct(private CustomFieldDefinitions $definitions) {}

    /**
     * Each entry carries what the builder copies into the template: the
     * JSON Schema fragment and the ui_schema entry, including the link.
     *
     * @return list<array{field: string, label: string, kind: string, group: ?string, key: string, schema: array<string, mixed>, ui_schema: array<string, mixed>}>
     */
    public function for(CustomFieldEntity $entity): array
    {
        $fields = [];

        foreach (self::CORE[$entity->value] as $name => $core) {
            $fields[] = $this->entry($entity, "core.{$name}", $core['label'], 'core', null, $core['schema'], $core['ui'] ?? []);
        }

        foreach ($this->definitions->fields($entity) as $field) {
            $ui = array_diff_key($field->ui, array_flip(['ui:title']));
            $fields[] = $this->entry($entity, "custom.{$field->key}", $field->label(), 'custom', $field->group->title, $field->schema, $ui);
        }

        return $fields;
    }

    /**
     * @param  array<string, mixed>  $schema
     * @param  array<string, mixed>  $ui
     */
    private function entry(CustomFieldEntity $entity, string $field, string $label, string $kind, ?string $group, array $schema, array $ui): array
    {
        $ui['ui:title'] = $label;
        $ui['ui:options'] = array_merge($ui['ui:options'] ?? [], ['link' => ['entity' => $entity->value, 'field' => $field]]);

        return [
            'field' => $field,
            'label' => $label,
            'kind' => $kind,
            'group' => $group,
            // The suggested key in the form: <entity>_<field>, locked once inserted.
            'key' => $entity->value.'_'.substr($field, strpos($field, '.') + 1),
            'schema' => $schema,
            'ui_schema' => $ui,
        ];
    }
}
