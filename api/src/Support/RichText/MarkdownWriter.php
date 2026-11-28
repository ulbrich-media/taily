<?php

namespace Taily\Support\RichText;

/**
 * Markdown for the public API, with literal text escaped.
 *
 * @psalm-import-type Node from RichTextRenderer
 */
final class MarkdownWriter implements RichTextWriter
{
    public function text(array $node): string
    {
        $text = (string) $node['text'];
        $marks = array_column($node['marks'] ?? [], null, 'type');

        $text = (string) preg_replace('/([\\\\`*_\[\]<>])/', '\\\\$1', $text);
        $text = (string) preg_replace('/&(?=#?\w+;)/', '\\\\&', $text);

        if ($marks === []) {
            return $text;
        }

        // Emphasis cannot start or end on whitespace.
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
        $inline = (string) preg_replace('/^(\h*)(#{1,6})(?=\h|$)/m', '$1\\\\$2', $inline);
        $inline = (string) preg_replace('/^(\h*)([-+])(?=[\h-]|$)/m', '$1\\\\$2', $inline);

        return (string) preg_replace('/^(\h*\d+)([.)])(?=\h|$)/m', '$1\\\\$2', $inline);
    }
}
