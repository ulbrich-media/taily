<?php

namespace Taily\Support\Tiervermittlung;

use Illuminate\Support\Collection;
use Taily\Models\ExportSetting;

/**
 * Which free-text compatibility words (`AnimalTrait` of type
 * `compatibility`) stand for which of the platform's normalized
 * `compatibleWith` options. Stored in `export_settings`.
 */
class CompatibilityMapping
{
    public const KEY = 'tiervermittlung.compatible_with';

    public const OPTIONS = ['children', 'dogs', 'cats'];

    public const DEFAULTS = [
        'children' => ['Kinder'],
        'dogs' => ['Hunde', 'Rüden', 'Hündinnen'],
        'cats' => ['Katzen'],
    ];

    /** @var array<string, list<string>>|null */
    private ?array $loaded = null;

    /**
     * @return array<string, list<string>> words per option, every option present
     */
    public function get(): array
    {
        if ($this->loaded !== null) {
            return $this->loaded;
        }

        $stored = ExportSetting::where('key', self::KEY)->first()?->value;

        return $this->loaded = is_array($stored) ? $this->normalize($stored) : self::DEFAULTS;
    }

    /**
     * @param  array<string, mixed>  $mapping
     * @return array<string, list<string>>
     */
    public function save(array $mapping): array
    {
        $normalized = $this->normalize($mapping);

        ExportSetting::updateOrCreate(['key' => self::KEY], ['value' => $normalized]);

        return $this->loaded = $normalized;
    }

    /**
     * Trims words, drops empty ones and duplicates (case-insensitive) and
     * keeps the options in a fixed order, so the payload hash is stable.
     *
     * @param  array<string, mixed>  $mapping
     * @return array<string, list<string>>
     */
    public function normalize(array $mapping): array
    {
        $result = [];

        foreach (self::OPTIONS as $option) {
            $words = [];
            $seen = [];

            foreach ((array) ($mapping[$option] ?? []) as $word) {
                $word = trim((string) $word);
                $key = mb_strtolower($word);

                if ($word === '' || isset($seen[$key])) {
                    continue;
                }

                $seen[$key] = true;
                $words[] = $word;
            }

            $result[$option] = $words;
        }

        return $result;
    }

    /**
     * The options matched by the given compatibility words (trimmed,
     * case-insensitive, exact), in the fixed option order.
     *
     * @param  Collection<int, string>  $values
     * @return array<string, true>
     */
    public function match(Collection $values): array
    {
        $values = $values->map(fn ($value) => mb_strtolower(trim((string) $value)))->filter()->all();
        $matches = [];

        foreach ($this->get() as $option => $words) {
            foreach ($words as $word) {
                if (in_array(mb_strtolower($word), $values, true)) {
                    $matches[$option] = true;

                    break;
                }
            }
        }

        return $matches;
    }
}
