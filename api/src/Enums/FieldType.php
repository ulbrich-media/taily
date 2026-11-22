<?php

namespace Taily\Enums;

/**
 * The type of a Case File Field Definition (docs/features/case-file.md#types).
 */
enum FieldType: string
{
    case TEXT = 'text';
    case TEXTAREA = 'textarea';
    case NUMBER = 'number';
    case INTEGER = 'integer';
    case BOOLEAN = 'boolean';
    case SELECT = 'select';
    case RADIO = 'radio';
    case DATE = 'date';
    case EMAIL = 'email';
    case PHONE = 'phone';
    case PHOTO = 'photo';
    case VIDEO = 'video';
    case DOCUMENT = 'document';
    case ADDRESS = 'address';
    case INFO = 'info';

    /**
     * Info Blocks are layout only and never hold a value.
     */
    public function holdsValue(): bool
    {
        return $this !== self::INFO;
    }

    public function isFile(): bool
    {
        return in_array($this, [self::PHOTO, self::VIDEO, self::DOCUMENT], true);
    }

    /**
     * Types another field's condition may depend on.
     */
    public function canControlCondition(): bool
    {
        return in_array($this, [self::BOOLEAN, self::SELECT, self::RADIO], true);
    }
}
