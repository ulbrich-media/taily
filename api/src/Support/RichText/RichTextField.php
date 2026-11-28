<?php

namespace Taily\Support\RichText;

use Tiptap\Core\Extension;
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
 * The fields that hold a rich text document, and what each one may contain.
 * This is the single source of truth for the allowed feature sets; the
 * frontend mirrors it in `richTextFeatures` and a test guards both.
 */
enum RichTextField: string
{
    case ContractBody = 'contract_body';

    /** The intro of a field group in the adoption (case file) fields. */
    case AdoptionFieldGroupIntro = 'adoption_field_group_intro';
    case AnimalDescription = 'animal_description';

    public const BOLD = 'bold';

    public const ITALIC = 'italic';

    public const HEADING = 'heading';

    public const LIST = 'list';

    public const LINK = 'link';

    /**
     * Headings are limited to these levels.
     */
    public const HEADING_LEVELS = [2, 3];

    /**
     * @return list<string>
     */
    public function features(): array
    {
        return match ($this) {
            // No links: the contract is rendered by dompdf/FPDI (ADR-013).
            self::ContractBody => [self::BOLD, self::ITALIC, self::HEADING, self::LIST],
            self::AdoptionFieldGroupIntro => [self::BOLD, self::ITALIC, self::LIST, self::LINK],
            self::AnimalDescription => [self::BOLD, self::ITALIC, self::HEADING, self::LIST, self::LINK],
        };
    }

    public function allows(string $feature): bool
    {
        return in_array($feature, $this->features(), true);
    }

    /**
     * The Tiptap extensions for this field: the one place that decides what
     * HTML output is produced for it and what is parsed back. Headings accept
     * every level; the sanitizer moves them into HEADING_LEVELS.
     *
     * @param  bool  $withHeadings  load headings even when the field has none, so the sanitizer can turn them into paragraphs
     * @return list<Extension>
     */
    public function extensions(bool $withHeadings = false): array
    {
        $features = $this->features();

        if ($withHeadings) {
            $features[] = self::HEADING;
        }

        return self::extensionsFor($features);
    }

    /**
     * Every extension of every field. Used to parse legacy HTML before the
     * sanitizer cuts the result down to a field.
     *
     * @return list<Extension>
     */
    public static function allExtensions(): array
    {
        return self::extensionsFor([self::BOLD, self::ITALIC, self::HEADING, self::LIST, self::LINK]);
    }

    /**
     * @param  list<string>  $features
     * @return list<Extension>
     */
    private static function extensionsFor(array $features): array
    {
        $extensions = [new Document, new Paragraph, new Text, new HardBreak];

        if (in_array(self::BOLD, $features, true)) {
            $extensions[] = new Bold;
        }

        if (in_array(self::ITALIC, $features, true)) {
            $extensions[] = new Italic;
        }

        if (in_array(self::HEADING, $features, true)) {
            $extensions[] = new Heading(['levels' => [1, 2, 3, 4, 5, 6]]);
        }

        if (in_array(self::LIST, $features, true)) {
            array_push($extensions, new BulletList, new OrderedList, new ListItem);
        }

        if (in_array(self::LINK, $features, true)) {
            $extensions[] = new Link([
                'allowedProtocols' => ['http', 'https', 'mailto'],
                'isAllowedUri' => RichTextSanitizer::isAllowedHref(...),
            ]);
        }

        return $extensions;
    }
}
