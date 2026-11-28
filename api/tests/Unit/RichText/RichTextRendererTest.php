<?php

namespace Taily\Tests\Unit\RichText;

use PHPUnit\Framework\TestCase;
use Taily\Support\RichText\RichText;
use Taily\Support\RichText\RichTextField;
use Taily\Support\RichText\RichTextRenderer;

class RichTextRendererTest extends TestCase
{
    private RichTextRenderer $renderer;

    protected function setUp(): void
    {
        $this->renderer = new RichTextRenderer;
    }

    /**
     * @return array<string, mixed>
     */
    private function sample(): array
    {
        return RichText::doc(
            RichText::heading('Über uns', 2),
            RichText::paragraph([
                RichText::text('Das ist '),
                RichText::text('fett', ['bold']),
                RichText::text(' und '),
                RichText::text('kursiv', ['italic']),
                ['type' => 'hardBreak'],
                RichText::text('Zeile zwei & mehr'),
            ]),
            RichText::bulletList(['eins', 'zwei']),
            RichText::orderedList(['a', 'b']),
        );
    }

    public function test_html(): void
    {
        $html = $this->renderer->toHtml($this->sample(), RichTextField::AnimalDescription);

        $this->assertSame(
            '<h2>Über uns</h2><p>Das ist <strong>fett</strong> und <em>kursiv</em><br>Zeile zwei &amp; mehr</p>'
            .'<ul><li><p>eins</p></li><li><p>zwei</p></li></ul><ol><li><p>a</p></li><li><p>b</p></li></ol>',
            $html,
        );
    }

    public function test_html_escapes_text_and_renders_links_safely(): void
    {
        $doc = RichText::doc(RichText::paragraph([
            RichText::text('<script>alert(1)</script>'),
            ['type' => 'text', 'text' => 'Link', 'marks' => [['type' => 'link', 'attrs' => ['href' => 'https://example.org/?a=1&b=2']]]],
            ['type' => 'text', 'text' => 'Böse', 'marks' => [['type' => 'link', 'attrs' => ['href' => 'javascript:alert(1)']]]],
        ]));

        $html = $this->renderer->toHtml($doc, RichTextField::AdoptionFieldGroupIntro);

        $this->assertStringNotContainsString('<script>', $html);
        $this->assertStringContainsString('&lt;script&gt;', $html);
        $this->assertStringContainsString('href="https://example.org/?a=1&amp;b=2"', $html);
        $this->assertStringContainsString('rel="noopener noreferrer nofollow"', $html);
        $this->assertStringNotContainsString('javascript:', $html);
    }

    public function test_html_follows_the_fields_features(): void
    {
        $doc = RichText::doc(RichText::paragraph([
            ['type' => 'text', 'text' => 'Link', 'marks' => [['type' => 'link', 'attrs' => ['href' => 'https://example.org']]]],
        ]), RichText::heading('Titel'));

        // The contract body has no links.
        $this->assertSame('<p>Link</p><h2>Titel</h2>', $this->renderer->toHtml($doc, RichTextField::ContractBody));

        $intro = $this->renderer->toHtml($doc, RichTextField::AdoptionFieldGroupIntro);
        $this->assertStringContainsString('<a ', $intro);
        $this->assertStringEndsWith('<p>Titel</p>', $intro);
    }

    public function test_text(): void
    {
        $this->assertSame(
            "Über uns\n\nDas ist fett und kursiv\nZeile zwei & mehr\n\n- eins\n- zwei\n\n1. a\n2. b",
            $this->renderer->toText($this->sample(), RichTextField::AnimalDescription),
        );
    }

    public function test_text_keeps_the_address_of_a_link(): void
    {
        $doc = RichText::doc(RichText::paragraph([
            ['type' => 'text', 'text' => 'Mehr', 'marks' => [['type' => 'link', 'attrs' => ['href' => 'https://example.org']]]],
            RichText::text(' '),
            ['type' => 'text', 'text' => 'https://example.org', 'marks' => [['type' => 'link', 'attrs' => ['href' => 'https://example.org']]]],
        ]));

        $this->assertSame('Mehr (https://example.org) https://example.org', $this->renderer->toText($doc, RichTextField::AnimalDescription));
    }

    public function test_text_of_nested_lists_is_indented(): void
    {
        $doc = RichText::doc([
            'type' => 'orderedList',
            'content' => [
                ['type' => 'listItem', 'content' => [RichText::paragraph('außen'), RichText::bulletList(['innen'])]],
            ],
        ]);

        $this->assertSame("1. außen\n   - innen", $this->renderer->toText($doc, RichTextField::AnimalDescription));
    }

    public function test_markdown(): void
    {
        $this->assertSame(
            "## Über uns\n\nDas ist **fett** und *kursiv*\\\nZeile zwei & mehr\n\n- eins\n- zwei\n\n1. a\n2. b",
            $this->renderer->toMarkdown($this->sample(), RichTextField::AnimalDescription),
        );
    }

    public function test_markdown_links_and_emphasis_edges(): void
    {
        $doc = RichText::doc(RichText::paragraph([
            ['type' => 'text', 'text' => 'Mehr ', 'marks' => [['type' => 'bold'], ['type' => 'link', 'attrs' => ['href' => 'https://example.org/a_(b)']]]],
            RichText::text('Info'),
        ]));

        // The space stays outside the emphasis, the parentheses of the address are encoded.
        $this->assertSame('[**Mehr**](https://example.org/a_%28b%29) Info', $this->renderer->toMarkdown($doc, RichTextField::AnimalDescription));
    }

    public function test_markdown_escapes_special_characters(): void
    {
        $doc = RichText::doc(
            RichText::paragraph('*Stern* _unter_ [eckig] <tag> `code` \\ rück'),
            RichText::paragraph('# keine Überschrift'),
            RichText::paragraph('- kein Punkt'),
            RichText::paragraph('1. keine Liste'),
            RichText::paragraph('---'),
        );

        $this->assertSame(
            "\\*Stern\\* \\_unter\\_ \\[eckig\\] \\<tag\\> \\`code\\` \\\\ rück\n\n\\# keine Überschrift\n\n\\- kein Punkt\n\n1\\. keine Liste\n\n\\---",
            $this->renderer->toMarkdown($doc, RichTextField::AnimalDescription),
        );
    }

    public function test_empty_values_render_as_empty_strings(): void
    {
        foreach ([null, '', RichText::doc()] as $value) {
            $this->assertSame('', $this->renderer->toHtml($value, RichTextField::AdoptionFieldGroupIntro));
            $this->assertSame('', $this->renderer->toText($value, RichTextField::AdoptionFieldGroupIntro));
            $this->assertSame('', $this->renderer->toMarkdown($value, RichTextField::AdoptionFieldGroupIntro));
        }
    }
}
