<?php

namespace Taily\Support\RichText;

use Tiptap\Editor;

/**
 * Renders a stored rich text document for a consumer: HTML for the contract
 * PDF, plain text for Tiervermittlung, Markdown for the public API. Every
 * method sanitizes first, so what is rendered never exceeds the field's
 * features. The stored document is never changed.
 *
 * @psalm-type Node = array<string, mixed>
 */
final class RichTextRenderer
{
    public function __construct(
        private RichTextSanitizer $sanitizer = new RichTextSanitizer,
    ) {}

    public function toHtml(mixed $value, RichTextField $field): string
    {
        $doc = $this->sanitizer->sanitize($value, $field);

        if ($doc === null) {
            return '';
        }

        return (new Editor(['extensions' => $field->extensions(), 'content' => $doc]))->getHTML();
    }

    public function toText(mixed $value, RichTextField $field): string
    {
        return $this->render($value, $field, new PlainTextWriter);
    }

    public function toMarkdown(mixed $value, RichTextField $field): string
    {
        return $this->render($value, $field, new MarkdownWriter);
    }

    private function render(mixed $value, RichTextField $field, RichTextWriter $writer): string
    {
        $doc = $this->sanitizer->sanitize($value, $field);

        return $doc === null ? '' : $this->blocks($doc['content'], $writer, 0);
    }

    /**
     * @param  list<Node>  $blocks
     */
    private function blocks(array $blocks, RichTextWriter $writer, int $depth): string
    {
        $parts = [];

        foreach ($blocks as $block) {
            $part = match ($block['type']) {
                'heading' => $writer->heading((int) $block['attrs']['level'], $this->inline($block['content'], $writer)),
                'bulletList', 'orderedList' => $this->list($block, $writer, $depth),
                default => $writer->paragraph($this->inline($block['content'] ?? [], $writer)),
            };

            if ($part !== '') {
                $parts[] = $part;
            }
        }

        // Blocks inside a list item sit on consecutive lines, top-level ones are separated by a blank line.
        return implode($depth > 0 ? "\n" : "\n\n", $parts);
    }

    /**
     * @param  Node  $list
     */
    private function list(array $list, RichTextWriter $writer, int $depth): string
    {
        $lines = [];

        foreach ($list['content'] as $index => $item) {
            $marker = $list['type'] === 'orderedList' ? ($index + 1).'. ' : '- ';
            $body = $this->blocks($item['content'], $writer, $depth + 1);
            $lines[] = $marker.str_replace("\n", "\n".str_repeat(' ', strlen($marker)), $body);
        }

        return implode("\n", $lines);
    }

    /**
     * @param  list<Node>  $nodes
     */
    private function inline(array $nodes, RichTextWriter $writer): string
    {
        $out = '';

        foreach ($nodes as $node) {
            $out .= $node['type'] === 'hardBreak' ? $writer->hardBreak() : $writer->text($node);
        }

        return $out;
    }
}
