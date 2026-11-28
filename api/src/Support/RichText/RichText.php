<?php

namespace Taily\Support\RichText;

/**
 * Helpers around the stored value of a rich text field: a Tiptap JSON
 * document as a JSON string, or `''` when empty (docs/coding-patterns/empty-strings.md).
 * The builders produce documents for seeders and tests.
 */
final class RichText
{
    /**
     * The document inside a value: an array or a JSON string. Anything that
     * is not a `doc` node gives null. This does not sanitize.
     *
     * @return array<string, mixed>|null
     */
    public static function parse(mixed $value): ?array
    {
        if (is_string($value)) {
            if ($value === '' || ! str_starts_with(ltrim($value), '{')) {
                return null;
            }

            $value = json_decode($value, true);
        }

        return is_array($value) && ($value['type'] ?? null) === 'doc' ? $value : null;
    }

    /**
     * @param  array<string, mixed>|null  $doc
     */
    public static function encode(?array $doc): string
    {
        return $doc === null ? '' : (string) json_encode($doc, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    /**
     * Plain text becomes paragraphs: blank lines split them, single newlines
     * stay as hard breaks.
     *
     * @return array<string, mixed>|null
     */
    public static function fromPlainText(string $text): ?array
    {
        $paragraphs = preg_split('/\R{2,}|\R\h*\R/u', trim($text)) ?: [];
        $nodes = [];

        foreach ($paragraphs as $paragraph) {
            $lines = preg_split('/\R/u', trim($paragraph)) ?: [];
            $inline = [];

            foreach ($lines as $index => $line) {
                if ($index > 0) {
                    $inline[] = ['type' => 'hardBreak'];
                }

                if (trim($line) !== '') {
                    $inline[] = ['type' => 'text', 'text' => trim($line)];
                }
            }

            if ($inline !== []) {
                $nodes[] = ['type' => 'paragraph', 'content' => $inline];
            }
        }

        return $nodes === [] ? null : self::doc(...$nodes);
    }

    /**
     * @param  array<string, mixed>  ...$blocks
     * @return array<string, mixed>
     */
    public static function doc(array ...$blocks): array
    {
        return ['type' => 'doc', 'content' => array_values($blocks)];
    }

    /**
     * @param  string|list<array<string, mixed>>  $content  text, or inline nodes
     * @return array<string, mixed>
     */
    public static function paragraph(string|array $content): array
    {
        return ['type' => 'paragraph', 'content' => is_string($content) ? [self::text($content)] : $content];
    }

    /**
     * @return array<string, mixed>
     */
    public static function heading(string $text, int $level = 2): array
    {
        return ['type' => 'heading', 'attrs' => ['level' => $level], 'content' => [self::text($text)]];
    }

    /**
     * @param  list<string>  $marks  `bold`, `italic`
     * @return array<string, mixed>
     */
    public static function text(string $text, array $marks = []): array
    {
        $node = ['type' => 'text', 'text' => $text];

        if ($marks !== []) {
            $node['marks'] = array_map(fn (string $mark) => ['type' => $mark], $marks);
        }

        return $node;
    }

    /**
     * @param  list<string|list<array<string, mixed>>>  $items  each item is text or inline nodes
     * @return array<string, mixed>
     */
    public static function bulletList(array $items): array
    {
        return self::list('bulletList', $items);
    }

    /**
     * @param  list<string|list<array<string, mixed>>>  $items
     * @return array<string, mixed>
     */
    public static function orderedList(array $items): array
    {
        return self::list('orderedList', $items);
    }

    /**
     * @param  list<string|list<array<string, mixed>>>  $items
     * @return array<string, mixed>
     */
    private static function list(string $type, array $items): array
    {
        return [
            'type' => $type,
            'content' => array_map(fn (string|array $item) => [
                'type' => 'listItem',
                'content' => [self::paragraph($item)],
            ], $items),
        ];
    }
}
