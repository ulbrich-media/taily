<?php

namespace Taily\Support\RichText;

/**
 * Markdown for the public API. The text of the document is literal, so
 * anything Markdown would read as syntax is backslash-escaped, and only the
 * marks of the document (bold, italic, link) produce Markdown syntax.
 *
 * Inline escaping (`text()`):
 *  - `\ ` * _ [ ] < >` get a backslash;
 *  - `&` gets a backslash only when it starts an entity (`&amp;`, `&#35;`),
 *    a lone `&` stays as it is;
 *  - emphasis cannot open or close next to whitespace in Markdown, so
 *    leading and trailing whitespace is moved outside the `*`/`**`/link;
 *  - link addresses have `(` and `)` percent-encoded so they cannot end the
 *    link early.
 *
 * Block-level escaping (`paragraph()`): a line that would read as a heading
 * (`#`), a bullet (`-`, `+`) or an ordered list item (`1.`, `1)`) has its
 * marker escaped. The same escaping applies to every line after a hard break.
 *
 * @psalm-import-type Node from RichTextRenderer
 */
final class MarkdownWriter implements RichTextWriter
{
    public function text(array $node): string
    {
        $text = (string) $node['text'];
        $marks = array_column($node['marks'] ?? [], null, 'type');

        // Characters with a meaning inside a line.
        $text = (string) preg_replace('/([\\\\`*_\[\]<>])/', '\\\\$1', $text);
        // Only an entity (`&amp;`, `&#35;`) is special, a plain ampersand is not.
        $text = (string) preg_replace('/&(?=#?\w+;)/', '\\\\&', $text);

        if ($marks === []) {
            return $text;
        }

        // Emphasis cannot start or end on whitespace: split into
        // leading whitespace, core and trailing whitespace.
        preg_match('/^(\s*)(.*?)(\s*)$/su', $text, $parts);

        if (($parts[2] ?? '') === '') {
            return $text;
        }

        $core = $parts[2];

        if (isset($marks['bold'], $marks['italic'])) {
            $core = '***'.$core.'***';
        } elseif (isset($marks['bold'])) {
            $core = '**'.$core.'**';
        } elseif (isset($marks['italic'])) {
            $core = '*'.$core.'*';
        }

        if (isset($marks['link'])) {
            $core = '['.$core.']('.strtr((string) $marks['link']['attrs']['href'], ['(' => '%28', ')' => '%29']).')';
        }

        return $parts[1].$core.$parts[3];
    }

    public function hardBreak(): string
    {
        return "\\\n";
    }

    public function heading(int $level, string $inline): string
    {
        return str_repeat('#', $level).' '.$inline;
    }

    public function paragraph(string $inline): string
    {
        // Text that looks like block syntax at the start of a line.
        // 1-6 `#` followed by a space or the end of the line: an ATX heading.
        $inline = (string) preg_replace('/^(\h*)(#{1,6})(?=\h|$)/m', '$1\\\\$2', $inline);
        // `-` or `+` followed by a space, another `-` (`---` rule) or the end: a bullet or rule.
        $inline = (string) preg_replace('/^(\h*)([-+])(?=[\h-]|$)/m', '$1\\\\$2', $inline);

        // Digits followed by `.` or `)` and a space or the end: an ordered list item.
        return (string) preg_replace('/^(\h*\d+)([.)])(?=\h|$)/m', '$1\\\\$2', $inline);
    }
}
