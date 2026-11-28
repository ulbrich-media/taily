<?php

namespace Taily\Tests\Unit\RichText;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Taily\Support\RichText\MarkdownWriter;

class MarkdownWriterTest extends TestCase
{
    private MarkdownWriter $writer;

    protected function setUp(): void
    {
        $this->writer = new MarkdownWriter;
    }

    /**
     * @param  list<string>  $marks
     * @return array<string, mixed>
     */
    private function node(string $text, array $marks = [], ?string $href = null): array
    {
        $node = ['type' => 'text', 'text' => $text];

        foreach ($marks as $mark) {
            $node['marks'][] = ['type' => $mark];
        }

        if ($href !== null) {
            $node['marks'][] = ['type' => 'link', 'attrs' => ['href' => $href]];
        }

        return $node;
    }

    /**
     * @return array<string, array{string, string}>
     */
    public static function inlineEscapes(): array
    {
        return [
            'plain text' => ['Hallo Welt', 'Hallo Welt'],
            'backslash' => ['a\\b', 'a\\\\b'],
            'backtick' => ['a`b', 'a\\`b'],
            'asterisk' => ['a*b', 'a\\*b'],
            'underscore' => ['a_b', 'a\\_b'],
            'square brackets' => ['[a]', '\\[a\\]'],
            'angle brackets' => ['<b>', '\\<b\\>'],
            'all of them' => ['\\`*_[]<>', '\\\\\\`\\*\\_\\[\\]\\<\\>'],
            'named entity' => ['&amp;', '\\&amp;'],
            'numeric entity' => ['&#35;', '\\&#35;'],
            'hex entity' => ['&#x23;', '\\&#x23;'],
            'lone ampersand' => ['Tom & Jerry', 'Tom & Jerry'],
            'ampersand without semicolon' => ['AT&T', 'AT&T'],
            'ampersand inside a word' => ['a&b', 'a&b'],
            'entity inside a sentence' => ['x &lt; y', 'x \\&lt; y'],
            'parentheses and other punctuation' => ['(a) {b} ! # - + . | ~', '(a) {b} ! # - + . | ~'],
            'umlauts' => ['Über uns ß', 'Über uns ß'],
            'empty text' => ['', ''],
        ];
    }

    #[DataProvider('inlineEscapes')]
    public function test_text_is_escaped(string $text, string $expected): void
    {
        $this->assertSame($expected, $this->writer->text($this->node($text)));
    }

    public function test_bold(): void
    {
        $this->assertSame('**fett**', $this->writer->text($this->node('fett', ['bold'])));
    }

    public function test_italic(): void
    {
        $this->assertSame('*kursiv*', $this->writer->text($this->node('kursiv', ['italic'])));
    }

    public function test_bold_and_italic_in_either_order(): void
    {
        $this->assertSame('***beides***', $this->writer->text($this->node('beides', ['bold', 'italic'])));
        $this->assertSame('***beides***', $this->writer->text($this->node('beides', ['italic', 'bold'])));
    }

    public function test_unknown_marks_are_ignored(): void
    {
        $this->assertSame('text', $this->writer->text($this->node('text', ['underline', 'code'])));
    }

    public function test_escaping_happens_inside_the_emphasis(): void
    {
        $this->assertSame('**\\*a\\***', $this->writer->text($this->node('*a*', ['bold'])));
    }

    /**
     * @return array<string, array{string, list<string>, string}>
     */
    public static function whitespaceCases(): array
    {
        return [
            'leading space' => [' fett', ['bold'], ' **fett**'],
            'trailing space' => ['fett ', ['bold'], '**fett** '],
            'both sides' => ['  fett  ', ['italic'], '  *fett*  '],
            'both marks' => [' x ', ['bold', 'italic'], ' ***x*** '],
            'inner space stays' => ['a b', ['bold'], '**a b**'],
            'newline and tab' => ["\tx\n", ['bold'], "\t**x**\n"],
            'only whitespace' => ['   ', ['bold'], '   '],
            'only whitespace with both marks' => [' ', ['bold', 'italic'], ' '],
            'empty text' => ['', ['bold'], ''],
            'no marks keeps whitespace' => [' x ', [], ' x '],
        ];
    }

    /**
     * @param  list<string>  $marks
     */
    #[DataProvider('whitespaceCases')]
    public function test_whitespace_stays_outside_the_emphasis(string $text, array $marks, string $expected): void
    {
        $this->assertSame($expected, $this->writer->text($this->node($text, $marks)));
    }

    public function test_link(): void
    {
        $this->assertSame(
            '[Seite](https://example.org/pfad?a=1&b=2)',
            $this->writer->text($this->node('Seite', [], 'https://example.org/pfad?a=1&b=2')),
        );
    }

    public function test_mailto_link(): void
    {
        $this->assertSame('[Mail](mailto:a@example.org)', $this->writer->text($this->node('Mail', [], 'mailto:a@example.org')));
    }

    public function test_link_around_emphasis(): void
    {
        $this->assertSame('[**Seite**](https://example.org)', $this->writer->text($this->node('Seite', ['bold'], 'https://example.org')));
        $this->assertSame('[***Seite***](https://example.org)', $this->writer->text($this->node('Seite', ['bold', 'italic'], 'https://example.org')));
    }

    public function test_link_text_is_escaped(): void
    {
        $this->assertSame('[\\[a\\]](https://example.org)', $this->writer->text($this->node('[a]', [], 'https://example.org')));
    }

    public function test_link_keeps_surrounding_whitespace_outside(): void
    {
        $this->assertSame(' [Seite](https://example.org) ', $this->writer->text($this->node(' Seite ', [], 'https://example.org')));
    }

    public function test_link_on_whitespace_only_text_is_dropped(): void
    {
        $this->assertSame(' ', $this->writer->text($this->node(' ', [], 'https://example.org')));
    }

    public function test_parentheses_in_the_address_are_encoded(): void
    {
        $this->assertSame(
            '[x](https://example.org/a_%28b%29)',
            $this->writer->text($this->node('x', [], 'https://example.org/a_(b)')),
        );
    }

    public function test_underscores_in_the_address_are_not_escaped(): void
    {
        $this->assertSame('[x](https://example.org/a_b)', $this->writer->text($this->node('x', [], 'https://example.org/a_b')));
    }

    public function test_hard_break(): void
    {
        $this->assertSame("\\\n", $this->writer->hardBreak());
    }

    public function test_headings(): void
    {
        $this->assertSame('## Titel', $this->writer->heading(2, 'Titel'));
        $this->assertSame('### Titel', $this->writer->heading(3, 'Titel'));
        $this->assertSame('# Titel', $this->writer->heading(1, 'Titel'));
    }

    /**
     * @return array<string, array{string, string}>
     */
    public static function paragraphs(): array
    {
        return [
            'plain' => ['Hallo Welt', 'Hallo Welt'],
            'empty' => ['', ''],
            'heading marker' => ['# Titel', '\\# Titel'],
            'level six heading marker' => ['###### Titel', '\\###### Titel'],
            'heading marker alone' => ['#', '\\#'],
            'seven hashes are no heading' => ['####### x', '####### x'],
            'hash without space is no heading' => ['#hashtag', '#hashtag'],
            'hash inside a line' => ['Nr. # 5', 'Nr. # 5'],
            'indented heading marker' => ['  # x', '  \\# x'],
            'dash bullet' => ['- Punkt', '\\- Punkt'],
            'plus bullet' => ['+ Punkt', '\\+ Punkt'],
            'bullet marker alone' => ['-', '\\-'],
            'rule' => ['---', '\\---'],
            'two dashes' => ['--', '\\--'],
            'indented bullet' => ['   - x', '   \\- x'],
            'dash glued to a word' => ['-5 Grad', '-5 Grad'],
            'plus glued to a word' => ['+1', '+1'],
            'dash inside a line' => ['a - b', 'a - b'],
            'ordered with dot' => ['1. Eins', '1\\. Eins'],
            'ordered with parenthesis' => ['1) Eins', '1\\) Eins'],
            'ordered with many digits' => ['12. Zwölf', '12\\. Zwölf'],
            'ordered marker alone' => ['3.', '3\\.'],
            'indented ordered' => ['  2. x', '  2\\. x'],
            'decimal number is no list' => ['1.5 kg', '1.5 kg'],
            'year with dot' => ['2024.', '2024\\.'],
            'number inside a line' => ['Es gibt 1. Chance', 'Es gibt 1. Chance'],
            'after a hard break' => ["ok\\\n# x", "ok\\\n\\# x"],
            'several lines' => ["# a\n- b\n1. c", "\\# a\n\\- b\n1\\. c"],
            'bullet then number' => ['- 1. x', '\\- 1. x'],
        ];
    }

    #[DataProvider('paragraphs')]
    public function test_paragraph_escapes_block_syntax(string $inline, string $expected): void
    {
        $this->assertSame($expected, $this->writer->paragraph($inline));
    }

    public function test_paragraph_escaping_does_not_touch_already_escaped_text(): void
    {
        // `text()` escapes `*`, the paragraph only looks at line starts.
        $inline = $this->writer->text($this->node('* nicht fett *'));

        $this->assertSame('\\* nicht fett \\*', $this->writer->paragraph($inline));
    }
}
