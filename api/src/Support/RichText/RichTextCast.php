<?php

namespace Taily\Support\RichText;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Stores a rich text field as a JSON string in a text column and reads it as
 * the Tiptap document (an array), or null when empty. Everything written is
 * sanitized for the field; empty stays `''`. A plain string that is not a
 * document becomes paragraphs, so callers can still assign text.
 *
 * Use as `RichTextCast::for(RichTextField::GroupIntro)`.
 *
 * @implements CastsAttributes<array<string, mixed>|null, mixed>
 */
class RichTextCast implements CastsAttributes
{
    private RichTextField $field;

    public function __construct(string $field)
    {
        $this->field = RichTextField::from($field);
    }

    public static function for(RichTextField $field): string
    {
        return self::class.':'.$field->value;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?array
    {
        return RichText::parse($value);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        if (is_string($value) && trim($value) !== '' && RichText::parse($value) === null) {
            $value = RichText::fromPlainText($value);
        }

        return RichText::encode((new RichTextSanitizer)->sanitize($value, $this->field));
    }
}
