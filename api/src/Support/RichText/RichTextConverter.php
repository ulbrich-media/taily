<?php

namespace Taily\Support\RichText;

use Illuminate\Support\Str;
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
 * Turns the legacy formats (Markdown, plain text) into a document for a
 * field. Used by the data migration. The result always went through the
 * sanitizer, so anything the field does not allow, such as links in a
 * contract body, is flattened to text.
 *
 * @psalm-type Node = array<string, mixed>
 */
final class RichTextConverter
{
    public function __construct(
        private RichTextSanitizer $sanitizer = new RichTextSanitizer,
    ) {}

    /**
     * @return Node|null null when nothing is left
     */
    public function fromMarkdown(string $markdown, RichTextField $field): ?array
    {
        if (trim($markdown) === '') {
            return null;
        }

        $html = Str::markdown($markdown, ['html_input' => 'strip', 'allow_unsafe_links' => false]);
        // Images are not part of any field.
        $html = trim((string) preg_replace('/<img\b[^>]*>/i', '', $html));

        // Nothing but stripped HTML or images; the parser needs something to parse.
        if ($html === '') {
            return null;
        }

        $editor = new Editor([
            'extensions' => [
                new Document, new Paragraph, new Text, new HardBreak, new Bold, new Italic,
                new Heading, new BulletList, new OrderedList, new ListItem, new Link,
            ],
            'content' => $html,
        ]);

        $doc = $editor->getDocument();

        return is_array($doc) ? $this->sanitizer->sanitize($this->softBreaksToSpaces($doc), $field) : null;
    }

    /**
     * @return Node|null
     */
    public function fromPlainText(string $text, RichTextField $field): ?array
    {
        return $this->sanitizer->sanitize(RichText::fromPlainText($text), $field);
    }

    /**
     * Markdown renders a single newline inside a paragraph as a space.
     *
     * @param  Node  $node
     * @return Node
     */
    private function softBreaksToSpaces(array $node): array
    {
        if (is_string($node['text'] ?? null)) {
            $node['text'] = preg_replace('/\s*\n\s*/', ' ', $node['text']);
        }

        if (is_array($node['content'] ?? null)) {
            $node['content'] = array_map(fn (array $child) => $this->softBreaksToSpaces($child), $node['content']);
        }

        return $node;
    }
}
