<?php

namespace Taily\Support\RichText;

/**
 * Cuts a Tiptap document down to what a field allows. It walks the tree with
 * a whitelist of nodes (`doc`, `paragraph`, `text`, `heading` levels 2-3,
 * `bulletList`, `orderedList`, `listItem`, `hardBreak`) and marks (`bold`,
 * `italic`, `link` to http(s)/mailto). Disallowed marks are dropped, disallowed
 * nodes are unwrapped to their content and unknown nodes without text
 * vanish. Heading levels outside 2-3 are moved into that range. A document
 * without any text gives null, which is stored as `''`.
 *
 * @psalm-type Node = array<string, mixed>
 */
final class RichTextSanitizer
{
    private const MAX_DEPTH = 12;

    private const MAX_HREF_LENGTH = 2048;

    /**
     * @return Node|null the cleaned `doc`, or null when empty or not a document
     */
    public function sanitize(mixed $value, RichTextField $field): ?array
    {
        $doc = RichText::parse($value);

        if ($doc === null) {
            return null;
        }

        $blocks = $this->blocks($this->children($doc), $field, 0);

        if (! $this->hasText($blocks)) {
            return null;
        }

        return ['type' => 'doc', 'content' => $blocks];
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
    private function blocks(array $nodes, RichTextField $field, int $depth): array
    {
        if ($depth > self::MAX_DEPTH) {
            return [];
        }

        $blocks = [];
        $inline = [];

        $flush = function () use (&$blocks, &$inline, $field): void {
            $content = $this->inline($inline, $field);
            $inline = [];

            if ($content !== []) {
                $blocks[] = ['type' => 'paragraph', 'content' => $content];
            }
        };

        foreach ($nodes as $node) {
            switch ($this->type($node)) {
                case 'text':
                case 'hardBreak':
                    $inline[] = $node;
                    break;

                case 'paragraph':
                    $flush();
                    $content = $this->inline($this->children($node), $field);

                    if ($content !== []) {
                        $blocks[] = ['type' => 'paragraph', 'content' => $content];
                    }
                    break;

                case 'heading':
                    $flush();
                    $content = $this->inline($this->children($node), $field);

                    if ($content === []) {
                        break;
                    }

                    if ($field->allows(RichTextField::HEADING)) {
                        $level = $node['attrs']['level'] ?? 2;
                        $level = is_numeric($level) ? (int) $level : 2;
                        $blocks[] = [
                            'type' => 'heading',
                            'attrs' => ['level' => max(RichTextField::HEADING_LEVELS[0], min(RichTextField::HEADING_LEVELS[1], $level))],
                            'content' => $content,
                        ];
                    } else {
                        $blocks[] = ['type' => 'paragraph', 'content' => $content];
                    }
                    break;

                case 'bulletList':
                case 'orderedList':
                    $flush();
                    $items = $this->listItems($this->children($node), $field, $depth + 1);

                    if ($items === []) {
                        break;
                    }

                    if ($field->allows(RichTextField::LIST)) {
                        $blocks[] = ['type' => $this->type($node), 'content' => $items];
                    } else {
                        foreach ($items as $item) {
                            array_push($blocks, ...$item['content']);
                        }
                    }
                    break;

                default:
                    // Unknown or misplaced node: keep what it contains.
                    $flush();
                    array_push($blocks, ...$this->blocks($this->children($node), $field, $depth + 1));
            }
        }

        $flush();

        return $blocks;
    }

    /**
     * @param  list<Node>  $nodes
     * @return list<Node>
     */
    private function listItems(array $nodes, RichTextField $field, int $depth): array
    {
        $items = [];

        foreach ($nodes as $node) {
            $content = $this->type($node) === 'listItem'
                ? $this->blocks($this->children($node), $field, $depth)
                : $this->blocks([$node], $field, $depth);

            if (! $this->hasText($content)) {
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
     * Inline content: text with its marks and hard breaks. Wrappers around
     * them are unwrapped.
     *
     * @param  list<Node>  $nodes
     * @return list<Node>
     */
    private function inline(array $nodes, RichTextField $field, int $depth = 0): array
    {
        if ($depth > self::MAX_DEPTH) {
            return [];
        }

        $result = [];

        foreach ($nodes as $node) {
            $type = $this->type($node);

            if ($type === 'text') {
                $text = $node['text'] ?? null;
                $text = is_string($text) ? preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $text) : null;

                if ($text === null || $text === '') {
                    continue;
                }

                $item = ['type' => 'text', 'text' => $text];
                $marks = $this->marks($node['marks'] ?? null, $field);

                if ($marks !== []) {
                    $item['marks'] = $marks;
                }

                $result[] = $item;
            } elseif ($type === 'hardBreak') {
                $result[] = ['type' => 'hardBreak'];
            } else {
                array_push($result, ...$this->inline($this->children($node), $field, $depth + 1));
            }
        }

        return $this->tidy($result);
    }

    /**
     * Merges neighbouring text with the same marks and drops hard breaks at
     * the edges.
     *
     * @param  list<Node>  $nodes
     * @return list<Node>
     */
    private function tidy(array $nodes): array
    {
        $merged = [];

        foreach ($nodes as $node) {
            $last = count($merged) - 1;

            if ($last >= 0 && $node['type'] === 'text' && $merged[$last]['type'] === 'text'
                && ($merged[$last]['marks'] ?? []) === ($node['marks'] ?? [])) {
                $merged[$last]['text'] .= $node['text'];
            } else {
                $merged[] = $node;
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
     * @return list<Node>
     */
    private function marks(mixed $marks, RichTextField $field): array
    {
        if (! is_array($marks)) {
            return [];
        }

        $bold = $italic = false;
        $href = null;

        foreach ($marks as $mark) {
            if (! is_array($mark)) {
                continue;
            }

            switch ($mark['type'] ?? null) {
                case 'bold':
                    $bold = $field->allows(RichTextField::BOLD);
                    break;
                case 'italic':
                    $italic = $field->allows(RichTextField::ITALIC);
                    break;
                case 'link':
                    $candidate = is_array($mark['attrs'] ?? null) ? trim((string) ($mark['attrs']['href'] ?? '')) : '';

                    if ($field->allows(RichTextField::LINK) && self::isAllowedHref($candidate)) {
                        $href = $candidate;
                    }
                    break;
            }
        }

        return array_values(array_filter([
            $bold ? ['type' => 'bold'] : null,
            $italic ? ['type' => 'italic'] : null,
            $href !== null ? ['type' => 'link', 'attrs' => ['href' => $href]] : null,
        ]));
    }

    /**
     * @param  list<Node>  $nodes
     */
    private function hasText(array $nodes): bool
    {
        foreach ($nodes as $node) {
            if ($node['type'] === 'text' && trim((string) $node['text']) !== '') {
                return true;
            }

            if ($this->hasText($this->children($node))) {
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

    /**
     * @param  Node  $node
     */
    private function type(array $node): string
    {
        return is_string($node['type'] ?? null) ? $node['type'] : '';
    }
}
