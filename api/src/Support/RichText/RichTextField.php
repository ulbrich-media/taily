<?php

namespace Taily\Support\RichText;

/**
 * The fields that hold a rich text document, and what each one may contain.
 * This is the single source of truth for the allowed feature sets; the
 * frontend mirrors it in `richTextFeatures` and a test guards both.
 */
enum RichTextField: string
{
    case ContractBody = 'contract_body';
    case GroupIntro = 'group_intro';
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
            self::GroupIntro => [self::BOLD, self::ITALIC, self::LIST, self::LINK],
            self::AnimalDescription => [self::BOLD, self::ITALIC, self::HEADING, self::LIST, self::LINK],
        };
    }

    public function allows(string $feature): bool
    {
        return in_array($feature, $this->features(), true);
    }
}
