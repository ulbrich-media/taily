<?php

namespace Taily\Tests\Unit\RichText;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Taily\Support\RichText\RichText;

class RichTextTest extends TestCase
{
    /**
     * @return array<string, array{mixed}>
     */
    public static function notDocuments(): array
    {
        return [
            'null' => [null],
            'empty string' => [''],
            'plain text' => ['Hallo'],
            'markdown' => ['# Titel'],
            'json list' => ['[1, 2]'],
            'broken json' => ['{"type": "doc"'],
            'other node' => ['{"type":"paragraph"}'],
            'doc without type' => ['{"content":[]}'],
            'integer' => [5],
            'boolean' => [true],
            'array of another type' => [['type' => 'paragraph']],
            'array without type' => [['content' => []]],
            'list array' => [[1, 2]],
        ];
    }

    #[DataProvider('notDocuments')]
    public function test_parse_gives_null_for_anything_but_a_doc(mixed $value): void
    {
        $this->assertNull(RichText::parse($value));
    }

    public function test_parse_accepts_an_array(): void
    {
        $doc = RichText::doc(RichText::paragraph('Hallo'));

        $this->assertSame($doc, RichText::parse($doc));
    }

    public function test_parse_accepts_a_json_string(): void
    {
        $doc = RichText::doc(RichText::paragraph('Hallo'));

        $this->assertSame($doc, RichText::parse(RichText::encode($doc)));
    }

    public function test_parse_accepts_leading_whitespace(): void
    {
        $this->assertSame(['type' => 'doc'], RichText::parse(" \n{\"type\":\"doc\"}"));
    }

    public function test_parse_does_not_sanitize(): void
    {
        $doc = ['type' => 'doc', 'content' => [['type' => 'script']]];

        $this->assertSame($doc, RichText::parse($doc));
    }

    public function test_encode_gives_an_empty_string_for_null(): void
    {
        $this->assertSame('', RichText::encode(null));
    }

    public function test_encode_keeps_unicode_and_slashes_readable(): void
    {
        $this->assertSame(
            '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Über/uns"}]}]}',
            RichText::encode(RichText::doc(RichText::paragraph('Über/uns'))),
        );
    }

    public function test_encode_and_parse_round_trip(): void
    {
        $doc = RichText::doc(
            RichText::heading('Titel', 3),
            RichText::paragraph([RichText::text('a', ['bold', 'italic']), ['type' => 'hardBreak'], RichText::text('b')]),
            RichText::bulletList(['x', 'y']),
        );

        $this->assertSame($doc, RichText::parse(RichText::encode($doc)));
    }

    /**
     * @return array<string, array{string}>
     */
    public static function emptyPlainTexts(): array
    {
        return [
            'empty' => [''],
            'spaces' => ['   '],
            'newlines' => ["\n\n\n"],
            'mixed whitespace' => [" \n \t\n\r\n "],
        ];
    }

    #[DataProvider('emptyPlainTexts')]
    public function test_plain_text_without_content_gives_null(string $text): void
    {
        $this->assertNull(RichText::fromPlainText($text));
    }

    public function test_plain_text_becomes_a_paragraph(): void
    {
        $this->assertSame(RichText::doc(RichText::paragraph('Hallo Welt')), RichText::fromPlainText('Hallo Welt'));
    }

    public function test_plain_text_is_trimmed(): void
    {
        $this->assertSame(RichText::doc(RichText::paragraph('Hallo')), RichText::fromPlainText("\n  Hallo  \n"));
    }

    public function test_a_single_newline_is_a_hard_break(): void
    {
        $expected = RichText::doc(RichText::paragraph([
            RichText::text('a'),
            ['type' => 'hardBreak'],
            RichText::text('b'),
        ]));

        $this->assertSame($expected, RichText::fromPlainText("a\nb"));
        $this->assertSame($expected, RichText::fromPlainText("a\r\nb"));
        $this->assertSame($expected, RichText::fromPlainText("  a  \n  b  "));
    }

    /**
     * @return array<string, array{string}>
     */
    public static function paragraphSeparators(): array
    {
        return [
            'blank line' => ["a\n\nb"],
            'windows blank line' => ["a\r\n\r\nb"],
            'several blank lines' => ["a\n\n\n\nb"],
            'blank line with spaces' => ["a\n   \nb"],
            'blank line with a tab' => ["a\n\t\nb"],
        ];
    }

    #[DataProvider('paragraphSeparators')]
    public function test_a_blank_line_starts_a_new_paragraph(string $text): void
    {
        $this->assertSame(
            RichText::doc(RichText::paragraph('a'), RichText::paragraph('b')),
            RichText::fromPlainText($text),
        );
    }

    public function test_hard_breaks_and_paragraphs_combine(): void
    {
        $expected = RichText::doc(
            RichText::paragraph([RichText::text('a'), ['type' => 'hardBreak'], RichText::text('b')]),
            RichText::paragraph('c'),
        );

        $this->assertSame($expected, RichText::fromPlainText("a\nb\n\nc"));
    }

    public function test_plain_text_is_not_interpreted(): void
    {
        $this->assertSame(
            RichText::doc(RichText::paragraph('<b>*x*</b> # y')),
            RichText::fromPlainText('<b>*x*</b> # y'),
        );
    }

    public function test_doc_reindexes_its_blocks(): void
    {
        $doc = RichText::doc(...['a' => RichText::paragraph('x'), 'b' => RichText::paragraph('y')]);

        $this->assertSame([0, 1], array_keys($doc['content']));
    }

    public function test_empty_doc(): void
    {
        $this->assertSame(['type' => 'doc', 'content' => []], RichText::doc());
    }

    public function test_paragraph_from_text_and_from_inline_nodes(): void
    {
        $this->assertSame(
            ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'x']]],
            RichText::paragraph('x'),
        );

        $inline = [RichText::text('a'), ['type' => 'hardBreak']];

        $this->assertSame(['type' => 'paragraph', 'content' => $inline], RichText::paragraph($inline));
    }

    public function test_heading_defaults_to_level_two(): void
    {
        $this->assertSame(
            ['type' => 'heading', 'attrs' => ['level' => 2], 'content' => [['type' => 'text', 'text' => 'T']]],
            RichText::heading('T'),
        );
        $this->assertSame(3, RichText::heading('T', 3)['attrs']['level']);
    }

    public function test_text_marks(): void
    {
        $this->assertSame(['type' => 'text', 'text' => 'x'], RichText::text('x'));
        $this->assertSame(
            ['type' => 'text', 'text' => 'x', 'marks' => [['type' => 'bold'], ['type' => 'italic']]],
            RichText::text('x', ['bold', 'italic']),
        );
    }

    public function test_lists(): void
    {
        $item = fn (string $text) => ['type' => 'listItem', 'content' => [RichText::paragraph($text)]];

        $this->assertSame(
            ['type' => 'bulletList', 'content' => [$item('a'), $item('b')]],
            RichText::bulletList(['a', 'b']),
        );
        $this->assertSame(
            ['type' => 'orderedList', 'content' => [$item('a')]],
            RichText::orderedList(['a']),
        );
    }

    public function test_list_items_can_hold_inline_nodes(): void
    {
        $list = RichText::bulletList([[RichText::text('a', ['bold'])]]);

        $this->assertSame([RichText::text('a', ['bold'])], $list['content'][0]['content'][0]['content']);
    }
}
