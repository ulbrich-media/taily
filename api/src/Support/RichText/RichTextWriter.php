<?php

namespace Taily\Support\RichText;

/**
 * Per-format output hooks for RichTextRenderer, which owns the shared tree
 * traversal. A new text format is a new writer; existing ones stay untouched.
 *
 * @psalm-import-type Node from RichTextRenderer
 */
interface RichTextWriter
{
    /**
     * @param  Node  $node  A text node with optional marks.
     */
    public function text(array $node): string;

    public function hardBreak(): string;

    public function heading(int $level, string $inline): string;

    public function paragraph(string $inline): string;
}
