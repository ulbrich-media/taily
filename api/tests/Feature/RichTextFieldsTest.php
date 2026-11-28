<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Taily\Enums\UserRole;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\ContractTemplate;
use Taily\Models\FieldGroup;
use Taily\Models\User;
use Taily\Support\RichText\RichText;
use Taily\Support\RichText\RichTextField;
use Taily\Support\RichText\RichTextRenderer;
use Taily\Tests\TestCase;

class RichTextFieldsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private AnimalType $dogs;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['name' => 'Ada Admin', 'email' => 'ada@example.com', 'role' => UserRole::ADMIN]);
        $this->dogs = AnimalType::create(['title' => 'Hund']);
    }

    private function as(User $user): self
    {
        return $this->actingAs($user)->withHeader('referer', 'http://localhost');
    }

    private function animal(): Animal
    {
        return Animal::create(['animal_type_id' => $this->dogs->id, 'name' => 'Bello', 'gender' => 'male']);
    }

    // -- Storing ---------------------------------------------------------------------------------

    public function test_an_animal_description_is_sanitized_and_stored_as_json(): void
    {
        $animal = $this->animal();
        $doc = RichText::doc(
            RichText::paragraph([
                ['type' => 'text', 'text' => 'Lieb', 'marks' => [['type' => 'bold'], ['type' => 'strike'], ['type' => 'link', 'attrs' => ['href' => 'javascript:alert(1)']]]],
            ]),
            ['type' => 'image', 'attrs' => ['src' => 'x.png']],
        );

        $response = $this->as($this->admin)->putJson("/internal/animals/{$animal->id}", ['publish_description' => $doc])->assertSuccessful();

        $expected = RichText::doc(RichText::paragraph([RichText::text('Lieb', ['bold'])]));
        $this->assertSame(RichText::encode($expected), DB::table('animals')->where('id', $animal->id)->value('publish_description'));
        $this->assertSame($expected, $response->json('data.publish_description'));
    }

    public function test_an_empty_editor_document_is_stored_as_an_empty_string(): void
    {
        $animal = $this->animal();

        foreach ([RichText::doc(RichText::paragraph('  ')), RichText::doc(), '', null] as $value) {
            $this->as($this->admin)->putJson("/internal/animals/{$animal->id}", ['publish_description' => $value])->assertSuccessful();

            $this->assertSame('', DB::table('animals')->where('id', $animal->id)->value('publish_description'));
        }

        $this->as($this->admin)->getJson("/internal/animals/{$animal->id}")->assertJsonPath('data.publish_description', null);
    }

    public function test_something_that_is_no_document_is_rejected(): void
    {
        $animal = $this->animal();

        $this->as($this->admin)->putJson("/internal/animals/{$animal->id}", ['publish_description' => 'Nur Text'])->assertUnprocessable()->assertJsonValidationErrors('publish_description');
        $this->as($this->admin)->putJson("/internal/animals/{$animal->id}", ['publish_description' => ['type' => 'paragraph']])->assertUnprocessable();
    }

    public function test_a_group_intro_is_limited_by_its_plain_text_length(): void
    {
        $group = FieldGroup::create(['animal_type_id' => $this->dogs->id, 'title' => 'Ankunft', 'position' => 1]);
        $bold = fn (int $length) => RichText::doc(RichText::paragraph([RichText::text(str_repeat('a', $length), ['bold'])]));

        $this->as($this->admin)->putJson("/internal/field-groups/{$group->id}", ['title' => 'Ankunft', 'intro' => $bold(2001)])
            ->assertUnprocessable()->assertJsonValidationErrors('intro');

        $this->as($this->admin)->putJson("/internal/field-groups/{$group->id}", ['title' => 'Ankunft', 'intro' => $bold(2000)])->assertSuccessful();
        $this->assertSame($bold(2000), $group->fresh()->intro);
    }

    public function test_a_group_intro_without_text_is_empty(): void
    {
        $group = FieldGroup::create(['animal_type_id' => $this->dogs->id, 'title' => 'Ankunft', 'position' => 1]);

        $this->as($this->admin)->putJson("/internal/field-groups/{$group->id}", ['title' => 'Ankunft'])->assertSuccessful();

        $this->assertSame('', DB::table('field_groups')->where('id', $group->id)->value('intro'));
        $this->assertNull($group->fresh()->intro);
    }

    public function test_a_contract_body_has_no_links_and_is_limited_to_fifty_thousand_characters(): void
    {
        $template = ContractTemplate::create(['animal_type_id' => $this->dogs->id, 'name' => 'V', 'title' => 'V']);
        $payload = fn ($body) => [
            'name' => 'V', 'title' => 'V', 'body' => $body, 'animal_type_id' => $this->dogs->id,
            'animal_fields' => [], 'mediator_fields' => [], 'adopter_fields' => [],
        ];
        $linked = RichText::doc(RichText::paragraph([['type' => 'text', 'text' => 'Siehe hier', 'marks' => [['type' => 'link', 'attrs' => ['href' => 'https://example.org']]]]]));

        $this->as($this->admin)->putJson("/internal/contract-templates/{$template->id}", $payload($linked))->assertSuccessful();
        $this->assertSame(RichText::doc(RichText::paragraph('Siehe hier')), $template->fresh()->body);

        $this->as($this->admin)->putJson("/internal/contract-templates/{$template->id}", $payload(RichText::doc(RichText::paragraph(str_repeat('a', 50001)))))
            ->assertUnprocessable()->assertJsonValidationErrors('body');
    }

    // -- Public API ------------------------------------------------------------------------------

    public function test_the_public_api_renders_the_description_as_markdown(): void
    {
        Sanctum::actingAs($this->admin, ['animals:read:adoptable']);
        $animal = $this->animal();
        $animal->update([
            'do_publish' => true,
            'publish_description' => RichText::doc(
                RichText::paragraph([RichText::text('Ein '), RichText::text('lieber', ['bold']), RichText::text(' Hund.')]),
                RichText::bulletList(['verspielt']),
            ),
        ]);
        Animal::create(['animal_type_id' => $this->dogs->id, 'name' => 'Ohne', 'gender' => 'male', 'do_publish' => true]);

        $response = $this->getJson('/api/animals')->assertOk();

        $byName = collect($response->json())->pluck('publish_description', 'name');
        $this->assertSame("Ein **lieber** Hund.\n\n- verspielt", $byName['Bello']);
        $this->assertSame('', $byName['Ohne']);

        $bello = collect($response->json())->firstWhere('name', 'Bello');
        $this->assertSame($bello['publish_description'], $bello['publish_description_markdown']);
        $this->assertStringContainsString('<strong>lieber</strong>', $bello['publish_description_html']);
        $this->assertStringNotContainsString('**', $bello['publish_description_text']);
        $this->assertStringContainsString('lieber', $bello['publish_description_text']);
        $ohne = collect($response->json())->firstWhere('name', 'Ohne');
        $this->assertSame(['', '', ''], [$ohne['publish_description_markdown'], $ohne['publish_description_html'], $ohne['publish_description_text']]);
    }

    // -- Migration -------------------------------------------------------------------------------

    public function test_the_migration_converts_markdown_and_plain_text_and_can_run_again(): void
    {
        $template = ContractTemplate::create(['animal_type_id' => $this->dogs->id, 'name' => 'V', 'title' => 'V']);
        $animal = $this->animal();
        $empty = $this->animal();
        $group = FieldGroup::create(['animal_type_id' => $this->dogs->id, 'title' => 'Ankunft', 'position' => 1]);

        // The values as the old code stored them.
        DB::table('contract_templates')->where('id', $template->id)->update(['body' => "## Bedingungen\n\nDas Tier wird **artgerecht** gehalten, siehe [hier](https://example.org)."]);
        DB::table('animals')->where('id', $animal->id)->update(['publish_description' => "Ein *lieber* Hund.\n\n- eins\n- zwei"]);
        DB::table('animals')->where('id', $empty->id)->update(['publish_description' => '']);
        DB::table('field_groups')->where('id', $group->id)->update(['intro' => "Erste Zeile\nzweite Zeile\n\nNeuer Absatz"]);

        $migration = require database_path('migrations/2026_11_28_000000_convert_rich_text_fields_to_json.php');
        $migration->up();

        $body = $template->fresh()->body;
        $this->assertSame(RichText::heading('Bedingungen'), $body['content'][0]);
        // The contract body has no links: the text stays.
        $this->assertSame(
            '<h2>Bedingungen</h2><p>Das Tier wird <strong>artgerecht</strong> gehalten, siehe hier.</p>',
            (new RichTextRenderer)->toHtml($body, RichTextField::ContractBody),
        );

        $this->assertSame("Ein *lieber* Hund.\n\n- eins\n- zwei", (new RichTextRenderer)->toMarkdown($animal->fresh()->publish_description, RichTextField::AnimalDescription));
        $this->assertSame('', DB::table('animals')->where('id', $empty->id)->value('publish_description'));

        $this->assertSame(
            RichText::doc(
                RichText::paragraph([RichText::text('Erste Zeile'), ['type' => 'hardBreak'], RichText::text('zweite Zeile')]),
                RichText::paragraph('Neuer Absatz'),
            ),
            $group->fresh()->intro,
        );

        $before = DB::table('field_groups')->pluck('intro', 'id')->all() + DB::table('animals')->pluck('publish_description', 'id')->all() + DB::table('contract_templates')->pluck('body', 'id')->all();
        $migration->up();
        $after = DB::table('field_groups')->pluck('intro', 'id')->all() + DB::table('animals')->pluck('publish_description', 'id')->all() + DB::table('contract_templates')->pluck('body', 'id')->all();

        $this->assertSame($before, $after);
    }

    public function test_the_migrated_description_keeps_its_public_markdown(): void
    {
        $animal = $this->animal();
        $markdown = "Ein **lieber** Hund mit [Webseite](https://example.org).\n\n- eins\n- zwei";
        DB::table('animals')->where('id', $animal->id)->update(['publish_description' => $markdown]);

        (require database_path('migrations/2026_11_28_000000_convert_rich_text_fields_to_json.php'))->up();

        $this->assertSame($markdown, (new RichTextRenderer)->toMarkdown($animal->fresh()->publish_description, RichTextField::AnimalDescription));
    }
}
