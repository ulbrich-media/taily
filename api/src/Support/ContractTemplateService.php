<?php

namespace Taily\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Taily\Enums\FieldType;
use Taily\Models\Adoption;
use Taily\Models\AnimalType;
use Taily\Models\ContractTemplate;
use Taily\Models\FieldDefinition;
use Taily\Support\CaseFile\CaseFileService;
use Taily\Support\CaseFile\ContractFieldRegistry;
use Taily\Support\CaseFile\FieldCatalogue;
use Taily\Support\RichText\RichTextField;
use Taily\Support\RichText\RichTextRenderer;
use Taily\Support\RichText\RichTextRule;

/**
 * Configures contract templates and turns one into what the contract prints
 * for an adoption (ADR-017).
 */
class ContractTemplateService
{
    public function __construct(
        private CaseFileService $caseFile,
    ) {}

    /**
     * What a template's sections can print besides the fixed fields: the
     * registry's animal and mediator fields, and per animal type the
     * catalogue fields that can be printed as text — files and Info Blocks
     * can't. `fixed` lists the fields every contract prints.
     *
     * @return array<string, mixed>
     */
    public function fieldOptions(): array
    {
        $configurable = fn (array $options) => array_values(array_filter($options, fn (array $option) => ! ContractTemplate::isFixed($option['key'])));
        $builtInLabels = array_column(FieldCatalogue::BUILT_INS, 'label', 'key');

        return [
            'animal' => $configurable(ContractFieldRegistry::options('animal')),
            'mediator' => $configurable(ContractFieldRegistry::options('mediator')),
            'adopter' => AnimalType::orderBy('title')->get()->map(fn (AnimalType $type) => [
                'animal_type_id' => $type->id,
                'fields' => $configurable($this->printableDefinitions($type->id)
                    ->map(fn (FieldDefinition $definition) => ['key' => $definition->key, 'label' => $definition->label])
                    ->values()
                    ->all()),
            ])->values(),
            'fixed' => collect(ContractTemplate::FIXED_FIELDS)->map(fn (array $entries, string $section) => array_map(fn (array $entry) => [
                ...$entry,
                'label' => $section === 'adopter' ? $builtInLabels[$entry['key']] : ContractFieldRegistry::spec($entry['key'])->label,
            ], $entries))->all(),
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
            'body' => ['present', 'nullable', new RichTextRule(RichTextField::ContractBody, 50000)],
            'animal_type_id' => ['required', 'uuid', 'exists:animal_types,id'],
            ...collect(ContractTemplate::SECTIONS)->flatMap(fn (string $section) => [
                "{$section}_fields" => ['present', 'array'],
                "{$section}_fields.*.key" => ['required', 'string', 'distinct'],
                "{$section}_fields.*.required" => ['required', 'boolean'],
            ])->all(),
        ], attributes: [
            'name' => 'Name',
            'title' => 'Titel',
            'animal_type_id' => 'Tierart',
        ])->validate();

        $this->assertKnownFields($validated);

        return DB::transaction(function () use ($template, $validated) {
            $template->fill([
                'animal_type_id' => $validated['animal_type_id'],
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

            return $template->load('animalType');
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
            $sections[$section] = collect($template->printedSection($section))
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
            // The photo is a fixed field: printed whenever the animal has one.
            'photo' => true,
        ];
    }

    /**
     * The wording as HTML, rendered from the rich text document. The document
     * has no images or links; the `<img>` strip stays as a safeguard because
     * dompdf would embed any local file one points to.
     */
    public function bodyHtml(ContractTemplate $template): string
    {
        $html = (new RichTextRenderer)->toHtml($template->body, RichTextField::ContractBody);

        return (string) preg_replace('/<img\b[^>]*>/i', '', $html);
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
     * be printable fields of the template's animal type, so a template can't
     * require something an adoption can't hold. Fixed fields are printed
     * anyway and can't be configured.
     *
     * @param  array<string, mixed>  $validated
     */
    private function assertKnownFields(array $validated): void
    {
        $errors = [];

        foreach (ContractTemplate::SECTIONS as $section) {
            foreach ($validated["{$section}_fields"] as $index => $entry) {
                if (ContractTemplate::isFixed($entry['key'])) {
                    $errors["{$section}_fields.{$index}.key"] = ['Dieses Feld steht immer im Vertrag.'];
                }
            }
        }

        foreach (['animal', 'mediator'] as $section) {
            foreach ($validated["{$section}_fields"] as $index => $entry) {
                if (! ContractFieldRegistry::has($entry['key']) || ContractFieldRegistry::subject($entry['key']) !== $section) {
                    $errors["{$section}_fields.{$index}.key"] = ['Dieses Feld gibt es hier nicht.'];
                }
            }
        }

        $printable = $this->printableDefinitions($validated['animal_type_id']);

        foreach ($validated['adopter_fields'] as $index => $entry) {
            if (! $printable->contains('key', $entry['key'])) {
                $errors["adopter_fields.{$index}.key"] = ['Dieses Feld gibt es in den Angaben der Tierart nicht.'];
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
