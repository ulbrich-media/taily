<?php

namespace Taily\Support\RichText;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates a rich text value: `''`/null, or a Tiptap `doc` as an object or
 * JSON string. The length limit applies to the plain-text rendering after
 * sanitizing, not to the JSON. The model cast stores the sanitized value.
 */
class RichTextRule implements ValidationRule
{
    public function __construct(
        private RichTextField $field,
        private ?int $maxLength = null,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $doc = RichText::parse($value);

        if ($doc === null) {
            $fail('Das Feld :attribute hat kein gültiges Format.');

            return;
        }

        if ($this->maxLength !== null
            && mb_strlen((new RichTextRenderer)->toText($doc, $this->field)) > $this->maxLength) {
            $fail("Das Feld :attribute darf höchstens {$this->maxLength} Zeichen lang sein.");
        }
    }
}
