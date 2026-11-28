<?php

namespace Taily\Support\RichText;

/**
 * Plain text for Tiervermittlung: no markup, link addresses kept in brackets.
 *
 * @psalm-import-type Node from RichTextRenderer
 */
final class PlainTextWriter implements RichTextWriter
{
    public function text(array $node): string
    {
        $text = (string) $node['text'];
        $marks = array_column($node['marks'] ?? [], null, 'type');
        $href = $marks['link']['attrs']['href'] ?? null;

        // The address would be lost otherwise.
        return $href !== null && trim($text) !== '' && $text !== $href && 'mailto:'.$text !== $href
            ? $text.' ('.$href.')'
            : $text;
    }

    public function hardBreak(): string
    {
        return "\n";
    }

    public function heading(int $level, string $inline): string
    {
        return $inline;
    }

    public function paragraph(string $inline): string
    {
        return $inline;
    }
}
