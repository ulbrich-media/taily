<?php

namespace Taily\Tests\Unit\RichText;

use PHPUnit\Framework\TestCase;
use Taily\Support\RichText\RichText;
use Taily\Support\RichText\RichTextField;
use Taily\Support\RichText\RichTextSanitizer;

class RichTextSanitizerTest extends TestCase
{
    private RichTextSanitizer $sanitizer;

    protected function setUp(): void
    {
        $this->sanitizer = new RichTextSanitizer;
    }

    /**
     * @param  list<array<string, mixed>>  $marks
     * @return array<string, mixed>
     */
    private function marked(string $text, array $marks): array
    {
        return ['type' => 'text', 'text' => $text, 'marks' => $marks];
    }

    public function test_an_allowed_document_is_kept(): void
    {
        $doc = RichText::doc(
            RichText::heading('Titel', 3),
            RichText::paragraph([RichText::text('Fett', ['bold']), RichText::text(' und '), RichText::text('kursiv', ['italic'])]),
            RichText::bulletList(['eins', 'zwei']),
            RichText::orderedList(['a']),
        );

        $this->assertSame($doc, $this->sanitizer->sanitize($doc, RichTextField::AnimalDescription));
    }

    public function test_a_json_string_is_accepted(): void
    {
        $doc = RichText::doc(RichText::paragraph('Hallo'));

        $this->assertSame($doc, $this->sanitizer->sanitize(RichText::encode($doc), RichTextField::GroupIntro));
    }

    public function test_empty_or_invalid_values_give_null(): void
    {
        foreach ([null, '', 'plain', '[]', ['type' => 'paragraph'], RichText::doc(), RichText::doc(RichText::paragraph('  ')), RichText::doc(['type' => 'paragraph'])] as $value) {
            $this->assertNull($this->sanitizer->sanitize($value, RichTextField::AnimalDescription));
        }
    }

    public function test_disallowed_marks_are_dropped_per_field(): void
    {
        $doc = RichText::doc(RichText::paragraph([
            $this->marked('x', [['type' => 'bold'], ['type' => 'strike'], ['type' => 'code'], ['type' => 'link', 'attrs' => ['href' => 'https://example.org']]]),
        ]));

        $body = $this->sanitizer->sanitize($doc, RichTextField::ContractBody);
        $intro = $this->sanitizer->sanitize($doc, RichTextField::GroupIntro);

        $this->assertSame([['type' => 'bold']], $body['content'][0]['content'][0]['marks']);
        $this->assertSame([['type' => 'bold'], ['type' => 'link', 'attrs' => ['href' => 'https://example.org']]], $intro['content'][0]['content'][0]['marks']);
    }

    public function test_links_need_an_http_or_mailto_address(): void
    {
        foreach (['javascript:alert(1)', 'data:text/html,x', 'ftp://example.org', '/relative', 'https://', ' JAVASCRIPT:x', 'https://a b'] as $href) {
            $doc = RichText::doc(RichText::paragraph([$this->marked('Link', [['type' => 'link', 'attrs' => ['href' => $href]]])]));
            $clean = $this->sanitizer->sanitize($doc, RichTextField::AnimalDescription);

            $this->assertArrayNotHasKey('marks', $clean['content'][0]['content'][0], $href);
            $this->assertSame('Link', $clean['content'][0]['content'][0]['text']);
        }

        foreach (['http://example.org/a?b=1', 'HTTPS://example.org', 'mailto:team@example.org'] as $href) {
            $doc = RichText::doc(RichText::paragraph([$this->marked('Link', [['type' => 'link', 'attrs' => ['href' => $href, 'target' => '_self', 'onclick' => 'x']]])]));
            $clean = $this->sanitizer->sanitize($doc, RichTextField::AnimalDescription);

            $this->assertSame([['type' => 'link', 'attrs' => ['href' => $href]]], $clean['content'][0]['content'][0]['marks']);
        }
    }

    public function test_disallowed_nodes_are_unwrapped_to_their_text(): void
    {
        $doc = RichText::doc(
            ['type' => 'blockquote', 'content' => [RichText::paragraph('Zitat')]],
            ['type' => 'codeBlock', 'content' => [RichText::text('code')]],
            ['type' => 'image', 'attrs' => ['src' => 'x.png']],
            ['type' => 'horizontalRule'],
            ['type' => 'script', 'content' => [RichText::text('alert(1)')]],
        );

        $clean = $this->sanitizer->sanitize($doc, RichTextField::AnimalDescription);

        $this->assertSame(
            [RichText::paragraph('Zitat'), RichText::paragraph('code'), RichText::paragraph('alert(1)')],
            $clean['content'],
        );
    }

    public function test_a_heading_the_field_does_not_allow_becomes_a_paragraph(): void
    {
        $doc = RichText::doc(RichText::heading('Titel'), RichText::bulletList(['eins']));

        $clean = $this->sanitizer->sanitize($doc, RichTextField::GroupIntro);

        $this->assertSame([RichText::paragraph('Titel')], [$clean['content'][0]]);
        $this->assertSame('bulletList', $clean['content'][1]['type']);
    }

    public function test_heading_levels_stay_between_two_and_three(): void
    {
        $doc = RichText::doc(RichText::heading('A', 1), RichText::heading('B', 4), RichText::heading('C', 2));

        $levels = array_map(fn (array $node) => $node['attrs']['level'], $this->sanitizer->sanitize($doc, RichTextField::ContractBody)['content']);

        $this->assertSame([2, 3, 2], $levels);
    }

    public function test_nested_lists_are_kept_and_items_start_with_a_paragraph(): void
    {
        $doc = RichText::doc([
            'type' => 'bulletList',
            'content' => [
                ['type' => 'listItem', 'content' => [RichText::paragraph('außen'), RichText::bulletList(['innen'])]],
                ['type' => 'listItem', 'content' => [RichText::bulletList(['nur Liste'])]],
                ['type' => 'listItem', 'content' => []],
                RichText::paragraph('lose'),
            ],
        ]);

        $clean = $this->sanitizer->sanitize($doc, RichTextField::AnimalDescription);
        $items = $clean['content'][0]['content'];

        $this->assertCount(3, $items);
        $this->assertSame('bulletList', $items[0]['content'][1]['type']);
        $this->assertSame(['type' => 'paragraph'], $items[1]['content'][0]);
        $this->assertSame('lose', $items[2]['content'][0]['content'][0]['text']);
    }

    public function test_neighbouring_text_with_the_same_marks_is_merged(): void
    {
        $doc = RichText::doc(RichText::paragraph([RichText::text('a'), RichText::text('b'), ['type' => 'hardBreak'], ['type' => 'hardBreak']]));

        $this->assertSame(RichText::doc(RichText::paragraph('ab')), $this->sanitizer->sanitize($doc, RichTextField::GroupIntro));
    }
}
