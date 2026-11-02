<?php

namespace Taily\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Taily\Enums\FieldType;
use Taily\Models\Adoption;
use Taily\Models\AnimalType;
use Taily\Models\ContractTemplate;
use Taily\Models\FieldDefinition;
use Taily\Support\CaseFile\CaseFileService;
use Taily\Support\CaseFile\ContractFieldRegistry;

/**
 * Configures contract templates and turns one into what the contract prints
 * for an adoption (ADR-016).
 */
class ContractTemplateService
{
    public function __construct(
        private CaseFileService $caseFile,
    ) {}

    /**
     * Everything a template's sections can print: the registry's animal and
     * mediator fields, and per animal type the catalogue fields that can be
     * printed as text — files and Info Blocks can't.
     *
     * @return array<string, mixed>
     */
    public function fieldOptions(): array
    {
        return [
            'animal' => ContractFieldRegistry::options('animal'),
            'mediator' => ContractFieldRegistry::options('mediator'),
            'adopter' => AnimalType::orderBy('title')->get()->map(fn (AnimalType $type) => [
                'animal_type_id' => $type->id,
                'fields' => $this->printableDefinitions($type->id)
                    ->map(fn (FieldDefinition $definition) => ['key' => $definition->key, 'label' => $definition->label])
                    ->values(),
            ])->values(),
        ];
    }

    /**
     * The active templates the mediator can choose from for an adoption.
     *
     * @return Collection<int, ContractTemplate>
     */
    public function offeredFor(Adoption $adoption): Collection
    {
        $adoption->loadMissing('animal');

        return ContractTemplate::offeredFor($adoption->animal?->animal_type_id)->orderBy('name')->get();
    }

    /**
     * Resolves the template the mediator chose for an adoption.
     *
     * @throws ValidationException under `template` when it isn't offered
     */
    public function chosen(Adoption $adoption, mixed $templateId): ContractTemplate
    {
        $template = is_string($templateId) ? $this->offeredFor($adoption)->firstWhere('id', $templateId) : null;

        if ($template === null) {
            throw ValidationException::withMessages([
                'template' => ['Diese Vertragsvorlage steht für die Tierart nicht zur Verfügung.'],
            ]);
        }

        return $template;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function save(ContractTemplate $template, array $data): ContractTemplate
    {
        $validated = Validator::make($data, [
            'name' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'body' => ['present', 'nullable', 'string', 'max:50000'],
            'animal_type_ids' => ['required', 'array', 'min:1'],
            'animal_type_ids.*' => ['uuid', 'distinct', 'exists:animal_types,id'],
            ...collect(ContractTemplate::SECTIONS)->flatMap(fn (string $section) => [
                "{$section}_fields" => ['present', 'array'],
                "{$section}_fields.*.key" => ['required', 'string', 'distinct'],
                "{$section}_fields.*.required" => ['required', 'boolean'],
            ])->all(),
        ], attributes: [
            'name' => 'Name',
            'title' => 'Titel',
            'animal_type_ids' => 'Tierarten',
        ])->validate();

        $this->assertKnownFields($validated);

        return DB::transaction(function () use ($template, $validated) {
            $template->fill([
                'name' => $validated['name'],
                'title' => $validated['title'],
                'body' => $validated['body'] ?? '',
                ...collect(ContractTemplate::SECTIONS)->mapWithKeys(fn (string $section) => [
                    "{$section}_fields" => collect($validated["{$section}_fields"])
                        ->map(fn (array $entry) => ['key' => $entry['key'], 'required' => (bool) $entry['required']])
                        ->values()
                        ->all(),
                ])->all(),
            ])->save();

            $template->animalTypes()->sync($validated['animal_type_ids']);

            return $template->load('animalTypes');
        });
    }

    /**
     * What the contract prints for an adoption: per section a list of
     * label/value rows, and the animal's photo when the template asks for
     * it. Fields without a value are left out — required ones can't be
     * missing unless the mediator waived them.
     *
     * @return array{sections: array<string, list<array{label: string, value: string}>>, photo: bool}
     */
    public function printout(ContractTemplate $template, Adoption $adoption): array
    {
        $definitions = $this->caseFile->definitions($adoption->animal?->animal_type_id)->keyBy('key');
        $values = $this->caseFile->values($adoption);
        $sections = [];

        foreach (ContractTemplate::SECTIONS as $section) {
            $sections[$section] = collect($template->section($section))
                ->reject(fn (array $entry) => $entry['key'] === 'animal.photo')
                ->map(function (array $entry) use ($adoption, $definitions, $values) {
                    $key = $entry['key'];

                    if (ContractFieldRegistry::has($key)) {
                        $value = ContractFieldRegistry::value($key, $adoption);

                        return ['label' => ContractFieldRegistry::printLabel($key), 'value' => $this->format(ContractFieldRegistry::type($key), $value)];
                    }

                    // A key the animal's catalogue doesn't (or no longer) define prints nothing.
                    $definition = $definitions->get($key);

                    return $definition === null ? null : ['label' => $definition->label, 'value' => $this->format($definition->type, $values[$key] ?? null, $definition)];
                })
                ->filter(fn (?array $row) => $row !== null && $row['value'] !== '')
                ->values()
                ->all();
        }

        return [
            'sections' => $sections,
            'photo' => in_array('animal.photo', array_column($template->section('animal'), 'key'), true),
        ];
    }

    /**
     * The wording as HTML. Markdown only — HTML in the wording is dropped.
     */
    public function bodyHtml(ContractTemplate $template): string
    {
        return Str::markdown($template->body, ['html_input' => 'strip', 'allow_unsafe_links' => false]);
    }

    /**
     * @return Collection<int, FieldDefinition>
     */
    private function printableDefinitions(string $animalTypeId): Collection
    {
        return $this->caseFile->definitions($animalTypeId)
            ->filter(fn (FieldDefinition $definition) => $definition->type->holdsValue() && ! $definition->type->isFile())
            ->values();
    }

    /**
     * Animal and mediator fields come from the registry. Adopter fields must
     * be printable fields of every animal type the template is offered for,
     * so a template can't require something an adoption can't hold.
     *
     * @param  array<string, mixed>  $validated
     */
    private function assertKnownFields(array $validated): void
    {
        $errors = [];

        foreach (['animal', 'mediator'] as $section) {
            foreach ($validated["{$section}_fields"] as $index => $entry) {
                if (! ContractFieldRegistry::has($entry['key']) || ContractFieldRegistry::subject($entry['key']) !== $section) {
                    $errors["{$section}_fields.{$index}.key"] = ['Dieses Feld gibt es hier nicht.'];
                }
            }
        }

        $types = AnimalType::whereIn('id', $validated['animal_type_ids'])->get();

        foreach ($validated['adopter_fields'] as $index => $entry) {
            $missingIn = $types->reject(fn (AnimalType $type) => $this->printableDefinitions($type->id)->contains('key', $entry['key']));

            if ($missingIn->isNotEmpty()) {
                $errors["adopter_fields.{$index}.key"] = ['Das Feld fehlt in den Angaben für: '.$missingIn->pluck('title')->join(', ').'.'];
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function format(FieldType $type, mixed $value, ?FieldDefinition $definition = null): string
    {
        if ($value === null || $value === '') {
            return '';
        }

        return match ($type) {
            FieldType::DATE => Carbon::parse($value)->format('d.m.Y'),
            FieldType::BOOLEAN => $value ? 'Ja' : 'Nein',
            FieldType::SELECT, FieldType::RADIO => $definition?->choices()[(string) $value] ?? (string) $value,
            FieldType::NUMBER => str_replace('.', ',', (string) $value),
            FieldType::ADDRESS => $this->formatAddress($value),
            default => is_array($value) ? '' : (string) $value,
        };
    }

    /**
     * @param  array<string, string>|mixed  $address
     */
    private function formatAddress(mixed $address): string
    {
        if (! is_array($address)) {
            return '';
        }

        $street = collect([$address['street_line'] ?? '', $address['street_line_additional'] ?? ''])->filter()->join(', ');
        $city = trim(($address['postal_code'] ?? '').' '.($address['city'] ?? ''));

        return collect([$street, $city])->filter()->join("\n");
    }
}
