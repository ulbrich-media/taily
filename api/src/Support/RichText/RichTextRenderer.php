<?php

namespace Taily\Support\RichText;

use Tiptap\Editor;
use Tiptap\Marks\Bold;
use Tiptap\Marks\Italic;
use Tiptap\Marks\Link;
use Tiptap\Nodes\BulletList;
use Tiptap\Nodes\Document;
use Tiptap\Nodes\HardBreak;
use Tiptap\Nodes\Heading;
use Tiptap\Nodes\ListItem;
use Tiptap\Nodes\OrderedList;
use Tiptap\Nodes\Paragraph;
use Tiptap\Nodes\Text;

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
    private const TEXT = 'text';

    private const MARKDOWN = 'markdown';

    public function __construct(
        private RichTextSanitizer $sanitizer = new RichTextSanitizer,
    ) {}

    public function toHtml(mixed $value, RichTextField $field): string
    {
        $doc = $this->sanitizer->sanitize($value, $field);

        if ($doc === null) {
            return '';
        }

        $extensions = [new Document, new Paragraph, new Text, new HardBreak];

        if ($field->allows(RichTextField::BOLD)) {
            $extensions[] = new Bold;
        }

        if ($field->allows(RichTextField::ITALIC)) {
            $extensions[] = new Italic;
        }

        if ($field->allows(RichTextField::HEADING)) {
            $extensions[] = new Heading(['levels' => RichTextField::HEADING_LEVELS]);
        }

        if ($field->allows(RichTextField::LIST)) {
            array_push($extensions, new BulletList, new OrderedList, new ListItem);
        }

        if ($field->allows(RichTextField::LINK)) {
            $extensions[] = new Link(['allowedProtocols' => ['http', 'https', 'mailto']]);
        }

        return (new Editor(['extensions' => $extensions, 'content' => $doc]))->getHTML();
    }

    public function toText(mixed $value, RichTextField $field): string
    {
        return $this->render($value, $field, self::TEXT);
    }

    public function toMarkdown(mixed $value, RichTextField $field): string
    {
        return $this->render($value, $field, self::MARKDOWN);
    }

    private function render(mixed $value, RichTextField $field, string $format): string
    {
        $doc = $this->sanitizer->sanitize($value, $field);

        return $doc === null ? '' : $this->blocks($doc['content'], $format, 0);
    }

    /**
     * @param  list<Node>  $blocks
     */
    private function blocks(array $blocks, string $format, int $depth): string
    {
        $parts = [];

        foreach ($blocks as $block) {
            $part = match ($block['type']) {
                'heading' => ($format === self::MARKDOWN ? str_repeat('#', (int) $block['attrs']['level']).' ' : '').$this->inline($block['content'], $format),
                'bulletList', 'orderedList' => $this->list($block, $format, $depth),
                default => $this->paragraph($block['content'] ?? [], $format),
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
    private function list(array $list, string $format, int $depth): string
    {
        $lines = [];

        foreach ($list['content'] as $index => $item) {
            $marker = $list['type'] === 'orderedList' ? ($index + 1).'. ' : '- ';
            $body = $this->blocks($item['content'], $format, $depth + 1);
            $lines[] = $marker.str_replace("\n", "\n".str_repeat(' ', strlen($marker)), $body);
        }

        return implode("\n", $lines);
    }

    /**
     * @param  list<Node>  $inline
     */
    private function paragraph(array $inline, string $format): string
    {
        $text = $this->inline($inline, $format);

        if ($format === self::MARKDOWN) {
            // Text that looks like block syntax at the start of a line.
            $text = (string) preg_replace('/^(\h*)(#{1,6})(?=\h|$)/m', '$1\\\\$2', $text);
            $text = (string) preg_replace('/^(\h*)([-+])(?=[\h-]|$)/m', '$1\\\\$2', $text);
            $text = (string) preg_replace('/^(\h*\d+)([.)])(?=\h|$)/m', '$1\\\\$2', $text);
        }

        return $text;
    }

    /**
     * @param  list<Node>  $nodes
     */
    private function inline(array $nodes, string $format): string
    {
        $out = '';

        foreach ($nodes as $node) {
            if ($node['type'] === 'hardBreak') {
                $out .= $format === self::MARKDOWN ? "\\\n" : "\n";
            } else {
                $out .= $this->text($node, $format);
            }
        }

        return $out;
    }

    /**
     * @param  Node  $node
     */
    private function text(array $node, string $format): string
    {
        $text = (string) $node['text'];
        $marks = array_column($node['marks'] ?? [], null, 'type');

        if ($format === self::TEXT) {
            $href = $marks['link']['attrs']['href'] ?? null;

            // The address would be lost otherwise.
            return $href !== null && trim($text) !== '' && $text !== $href && 'mailto:'.$text !== $href
                ? $text.' ('.$href.')'
                : $text;
        }

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
}
