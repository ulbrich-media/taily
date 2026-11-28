<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Taily\Support\RichText\RichText;
use Taily\Support\RichText\RichTextConverter;
use Taily\Support\RichText\RichTextField;
use Taily\Support\RichText\RichTextRenderer;

/**
 * Moves the three rich text fields to the Tiptap JSON document: the
 * Markdown fields (contract body, animal description) go through Markdown →
 * HTML → document, the plain-text group intro becomes paragraphs. The result
 * is sanitized for the field, so whatever it does not allow (links in a
 * contract body, for example) is flattened to text. Empty stays `''`.
 * Values that already are a document are skipped, so a rerun is harmless.
 * The JSON is several times longer than the text it holds, so the two `text`
 * columns grow to `mediumText` (the contract body already is `longText`).
 */
return new class extends Migration
{
    /** Column, field, and whether the old value is Markdown (otherwise plain text). */
    private const FIELDS = [
        ['contract_templates', 'body', RichTextField::ContractBody, true],
        ['animals', 'publish_description', RichTextField::AnimalDescription, true],
        ['field_groups', 'intro', RichTextField::AdoptionFieldGroupIntro, false],
    ];

    public function up(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            $table->mediumText('publish_description')->nullable()->change();
        });
        Schema::table('field_groups', function (Blueprint $table) {
            $table->mediumText('intro')->change();
        });

        $converter = new RichTextConverter;

        foreach (self::FIELDS as [$table, $column, $field, $markdown]) {
            $this->convert($table, $column, function (string $old) use ($converter, $field, $markdown) {
                $doc = $markdown ? $converter->fromMarkdown($old, $field) : $converter->fromPlainText($old, $field);

                return RichText::encode($doc);
            });
        }
    }

    /**
     * Back to Markdown (plain text for the intro). Formatting the old format
     * cannot hold is lost.
     */
    public function down(): void
    {
        $renderer = new RichTextRenderer;

        foreach (self::FIELDS as [$table, $column, $field, $markdown]) {
            DB::table($table)->whereNotNull($column)->where($column, '!=', '')->orderBy('id')->chunk(100, function ($rows) use ($table, $column, $field, $markdown, $renderer) {
                foreach ($rows as $row) {
                    $doc = RichText::parse($row->{$column});

                    if ($doc !== null) {
                        DB::table($table)->where('id', $row->id)->update([
                            $column => $markdown ? $renderer->toMarkdown($doc, $field) : $renderer->toText($doc, $field),
                        ]);
                    }
                }
            });
        }
    }

    /**
     * @param  callable(string): string  $convert
     */
    private function convert(string $table, string $column, callable $convert): void
    {
        // Ids are uuids: chunkById pages by the primary key and survives the updates.
        DB::table($table)->whereNotNull($column)->where($column, '!=', '')->chunkById(100, function ($rows) use ($table, $column, $convert) {
            foreach ($rows as $row) {
                $old = (string) $row->{$column};

                if (RichText::parse($old) !== null) {
                    continue;
                }

                DB::table($table)->where('id', $row->id)->update([$column => $convert($old)]);
            }
        });
    }
};
