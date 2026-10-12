<?php

namespace Taily\Support;

/**
 * Absolute paths to the font files the contract layout embeds.
 *
 * The layout needs real filesystem paths: dompdf resolves an `@font-face`
 * `url()` by reading the file, and only accepts TrueType — the variable
 * `.woff2` files the frontend pulls from npm (see `frontend/src/index.css`)
 * cannot be reused, so static instances of the same two families ship with
 * this package instead.
 *
 * A Blade view cannot work the path out on its own: compiled views live in
 * the app's view cache, so `__DIR__` inside one points there rather than at
 * the package — which matters as soon as an installation overrides the
 * layout into its own `resources/views/vendor/taily/`. Resolving from this
 * class keeps that override working, and keeps the files below the package
 * directory, i.e. below `base_path()`, which is what dompdf's chroot allows
 * it to read.
 */
class ContractFonts
{
    /**
     * The directory holding the package's font files.
     */
    public static function directory(): string
    {
        return dirname(__DIR__, 2).'/resources/fonts';
    }

    /**
     * One font file by name, e.g. `PublicSans-Regular.ttf`.
     */
    public static function path(string $file): string
    {
        return self::directory().'/'.$file;
    }
}
