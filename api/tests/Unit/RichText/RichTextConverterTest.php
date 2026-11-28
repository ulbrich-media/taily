<?php

namespace Taily\Tests\Unit\RichText;

use PHPUnit\Framework\TestCase;
use Taily\Support\RichText\RichText;
use Taily\Support\RichText\RichTextConverter;
use Taily\Support\RichText\RichTextField;
use Taily\Support\RichText\RichTextRenderer;
use Taily\Support\RichText\RichTextSanitizer;

class RichTextConverterTest extends TestCase
{
    private RichTextConverter $converter;

    protected function setUp(): void
    {
        $this->converter = new RichTextConverter;
    }

    public function test_markdown_becomes_a_document(): void
    {
        $markdown = "## Bedingungen\n\nDas Tier wird **artgerecht** und *liebevoll* gehalten.\nZweite Zeile.\n\n- eins\n- zwei\n\n1. a\n2. b\n\n# Groß\n\n##### Klein";

        $doc = $this->converter->fromMarkdown($markdown, RichTextField::ContractBody);

        $this->assertSame(RichText::doc(
            RichText::heading('Bedingungen', 2),
            RichText::paragraph([
                RichText::text('Das Tier wird '),
                RichText::text('artgerecht', ['bold']),
                RichText::text(' und '),
                RichText::text('liebevoll', ['italic']),
                RichText::text(' gehalten. Zweite Zeile.'),
            ]),
            RichText::bulletList(['eins', 'zwei']),
            RichText::orderedList(['a', 'b']),
            RichText::heading('Groß', 2),
            RichText::heading('Klein', 3),
        ), $doc);
    }

    public function test_the_result_passes_the_sanitizer_unchanged(): void
    {
        $markdown = "Intro mit [Link](https://example.org) und **fett**.\n\n- [x](mailto:a@example.org)\n- zwei\n\n  weiter\n\n> Zitat\n\n`code`";

        foreach (RichTextField::cases() as $field) {
            $doc = $this->converter->fromMarkdown($markdown, $field);

            $this->assertSame($doc, (new RichTextSanitizer)->sanitize($doc, $field), $field->value);
        }
    }

    public function test_links_are_flattened_to_text_in_a_contract_body(): void
    {
        $markdown = 'Siehe [unsere Seite](https://example.org).';

        $body = $this->converter->fromMarkdown($markdown, RichTextField::ContractBody);
        $description = $this->converter->fromMarkdown($markdown, RichTextField::AnimalDescription);

        $this->assertSame(RichText::doc(RichText::paragraph('Siehe unsere Seite.')), $body);
        $this->assertSame('https://example.org', $description['content'][0]['content'][1]['marks'][0]['attrs']['href']);
    }

    public function test_html_images_and_unsafe_links_do_not_survive(): void
    {
        $markdown = "Text <b>roh</b>\n\n<script>alert(1)</script>\n\n![Bild](/etc/hosts)\n\n[böse](javascript:alert(1))";

        $doc = $this->converter->fromMarkdown($markdown, RichTextField::AnimalDescription);
        $json = RichText::encode($doc);

        $this->assertStringNotContainsString('script', $json);
        $this->assertStringNotContainsString('hosts', $json);
        $this->assertStringNotContainsString('javascript', $json);
        $this->assertStringContainsString('Text', $json);
    }

    public function test_the_html_stays_the_same_as_the_old_markdown_rendering(): void
    {
        $markdown = "## Pflichten\n\nDas Tier wird **artgerecht** gehalten.\n\n- eins\n- zwei";

        $doc = $this->converter->fromMarkdown($markdown, RichTextField::ContractBody);
        $html = (new RichTextRenderer)->toHtml($doc, RichTextField::ContractBody);

        $this->assertSame('<h2>Pflichten</h2><p>Das Tier wird <strong>artgerecht</strong> gehalten.</p><ul><li><p>eins</p></li><li><p>zwei</p></li></ul>', $html);
    }

    public function test_markdown_survives_a_round_trip_through_the_public_rendering(): void
    {
        $markdown = "Hallo **Welt** mit *Stil* und [Link](https://example.org).\n\n- eins\n- zwei";

        $doc = $this->converter->fromMarkdown($markdown, RichTextField::AnimalDescription);

        $this->assertSame($markdown, (new RichTextRenderer)->toMarkdown($doc, RichTextField::AnimalDescription));
    }

    public function test_empty_markdown_stays_empty(): void
    {
        foreach (['', "  \n ", '<script></script>', '![x](y.png)'] as $markdown) {
            $this->assertNull($this->converter->fromMarkdown($markdown, RichTextField::AnimalDescription), $markdown);
        }
    }

    public function test_plain_text_becomes_paragraphs_with_hard_breaks(): void
    {
        $doc = $this->converter->fromPlainText("Erste Zeile\nzweite Zeile\n\nNeuer Absatz\n\n\n\nNoch einer <b>roh</b>", RichTextField::GroupIntro);

        $this->assertSame(RichText::doc(
            RichText::paragraph([RichText::text('Erste Zeile'), ['type' => 'hardBreak'], RichText::text('zweite Zeile')]),
            RichText::paragraph('Neuer Absatz'),
            RichText::paragraph('Noch einer <b>roh</b>'),
        ), $doc);
    }

    public function test_empty_plain_text_stays_empty(): void
    {
        $this->assertNull($this->converter->fromPlainText('', RichTextField::GroupIntro));
        $this->assertNull($this->converter->fromPlainText(" \n\n ", RichTextField::GroupIntro));
    }
}
