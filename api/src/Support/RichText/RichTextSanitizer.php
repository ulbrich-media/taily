<?php

namespace Taily\Support\RichText;

use Tiptap\Editor;

/**
 * Cuts a Tiptap document down to what a field allows. Each top-level block is
 * rendered to HTML and parsed back with only the field's extensions loaded
 * (`RichTextField::extensions()`): unknown nodes keep their text, unknown marks
 * and links that fail `isAllowedHref()` disappear. A pass over the result then
 * tidies the structure the parser leaves loose: heading levels move into 2-3
 * (or become paragraphs in a field without headings), loose text gets a
 * paragraph, list items start with a paragraph, neighbouring text with the
 * same marks is merged and empty blocks vanish. A document without any text
 * gives null, which is stored as `''`.
 *
 * @psalm-type Node = array<string, mixed>
 */
final class RichTextSanitizer
{
    private const MAX_DEPTH = 12;

    private const MAX_HREF_LENGTH = 2048;

    /**
     * @return Node|null the cleaned `doc`, or null when empty, too deeply nested or not a document
     */
    public function sanitize(mixed $value, RichTextField $field): ?array
    {
        $doc = RichText::parse($value);

        if ($doc === null || $this->depth($doc) > self::MAX_DEPTH) {
            return null;
        }

        // Headings are always loaded here; the pass below decides what becomes of them.
        $extensions = $field->extensions(withHeadings: true);
        $blocks = [];

        // One block at a time, so text of unrelated unknown nodes is not glued together.
        foreach ($this->children($doc) as $block) {
            $html = (new Editor(['extensions' => $extensions, 'content' => RichText::doc($block)]))->getHTML();

            if ($html === '') {
                continue;
            }

            $parsed = (new Editor(['extensions' => $extensions, 'content' => $html]))->getDocument();

            if (is_array($parsed)) {
                array_push($blocks, ...$this->children($parsed));
            }
        }

        $clean = ['type' => 'doc', 'content' => $this->blocks($blocks, $field)];

        return $this->hasText($clean) ? $clean : null;
    }

    public static function isAllowedHref(mixed $href): bool
    {
        return is_string($href)
            && strlen($href) <= self::MAX_HREF_LENGTH
            && preg_match('~^(?:https?://|mailto:)[^\s<>"]+$~i', $href) === 1;
    }

    /**
     * @param  list<Node>  $nodes
     * @return list<Node>
     */
    private function blocks(array $nodes, RichTextField $field): array
    {
        $blocks = [];
        $inline = [];

        $flush = function () use (&$blocks, &$inline): void {
            $content = $this->tidy($inline);
            $inline = [];

            if ($content !== []) {
                $blocks[] = ['type' => 'paragraph', 'content' => $content];
            }
        };

        foreach ($nodes as $node) {
            switch ($node['type'] ?? null) {
                case 'text':
                case 'hardBreak':
                    $inline[] = $node;
                    break;

                case 'bulletList':
                case 'orderedList':
                    $flush();
                    $items = $this->listItems($this->children($node), $field);

                    if ($items !== []) {
                        $blocks[] = ['type' => $node['type'], 'content' => $items];
                    }
                    break;

                default:
                    $flush();
                    $content = $this->tidy($this->children($node));

                    if ($content === []) {
                        break;
                    }

                    $blocks[] = $this->textBlock($node, $content, $field);
            }
        }

        $flush();

        return $blocks;
    }

    /**
     * A paragraph or heading: headings move into range or become paragraphs.
     *
     * @param  Node  $node
     * @param  list<Node>  $content
     * @return Node
     */
    private function textBlock(array $node, array $content, RichTextField $field): array
    {
        if (($node['type'] ?? null) !== 'heading' || ! $field->allows(RichTextField::HEADING)) {
            return ['type' => 'paragraph', 'content' => $content];
        }

        $level = $node['attrs']['level'] ?? RichTextField::HEADING_LEVELS[0];
        $level = is_numeric($level) ? (int) $level : RichTextField::HEADING_LEVELS[0];

        return [
            'type' => 'heading',
            'attrs' => ['level' => max(RichTextField::HEADING_LEVELS[0], min(RichTextField::HEADING_LEVELS[1], $level))],
            'content' => $content,
        ];
    }

    /**
     * @param  list<Node>  $nodes
     * @return list<Node>
     */
    private function listItems(array $nodes, RichTextField $field): array
    {
        $items = [];

        foreach ($nodes as $node) {
            $content = $this->blocks(($node['type'] ?? null) === 'listItem' ? $this->children($node) : [$node], $field);

            if (! $this->hasText(['content' => $content])) {
                continue;
            }

            // An item starts with a paragraph.
            if ($content[0]['type'] !== 'paragraph') {
                array_unshift($content, ['type' => 'paragraph']);
            }

            $items[] = ['type' => 'listItem', 'content' => $content];
        }

        return $items;
    }

    /**
     * Inline content: text with its marks and hard breaks. Merges neighbouring
     * text with the same marks and drops hard breaks at the edges.
     *
     * @param  list<Node>  $nodes
     * @return list<Node>
     */
    private function tidy(array $nodes): array
    {
        $merged = [];

        foreach ($nodes as $node) {
            if (($node['type'] ?? null) === 'hardBreak') {
                $merged[] = ['type' => 'hardBreak'];

                continue;
            }

            $text = is_string($node['text'] ?? null) ? preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $node['text']) : null;

            if (($node['type'] ?? null) !== 'text' || $text === null || $text === '') {
                continue;
            }

            $item = ['type' => 'text', 'text' => $text];
            $marks = $this->marks($node['marks'] ?? null);

            if ($marks !== []) {
                $item['marks'] = $marks;
            }

            $last = count($merged) - 1;

            if ($last >= 0 && $merged[$last]['type'] === 'text' && ($merged[$last]['marks'] ?? []) === ($item['marks'] ?? [])) {
                $merged[$last]['text'] .= $text;
            } else {
                $merged[] = $item;
            }
        }

        while ($merged !== [] && $merged[0]['type'] === 'hardBreak') {
            array_shift($merged);
        }

        while ($merged !== [] && $merged[count($merged) - 1]['type'] === 'hardBreak') {
            array_pop($merged);
        }

        return $merged;
    }

    /**
     * Marks as the parser reads them from the rendered HTML; a link keeps only
     * its address, not the rel and target the renderer adds.
     *
     * @return list<Node>
     */
    private function marks(mixed $marks): array
    {
        $clean = [];

        foreach (is_array($marks) ? $marks : [] as $mark) {
            if (! is_array($mark)) {
                continue;
            }

            if (($mark['type'] ?? null) === 'link') {
                $mark = ['type' => 'link', 'attrs' => ['href' => $mark['attrs']['href'] ?? '']];
            } else {
                $mark = ['type' => $mark['type'] ?? ''];
            }

            $clean[] = $mark;
        }

        return $clean;
    }

    /**
     * @param  Node  $node
     */
    private function depth(array $node): int
    {
        $deepest = 0;

        foreach ($this->children($node) as $child) {
            $deepest = max($deepest, $this->depth($child));
        }

        return $deepest + 1;
    }

    /**
     * @param  Node  $node
     */
    private function hasText(array $node): bool
    {
        if (($node['type'] ?? null) === 'text' && trim((string) ($node['text'] ?? '')) !== '') {
            return true;
        }

        foreach ($this->children($node) as $child) {
            if ($this->hasText($child)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  Node  $node
     * @return list<Node>
     */
    private function children(array $node): array
    {
        $content = $node['content'] ?? null;

        return is_array($content) ? array_values(array_filter($content, 'is_array')) : [];
    }
}
