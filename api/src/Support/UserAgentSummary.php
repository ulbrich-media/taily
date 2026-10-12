<?php

namespace Taily\Support;

/**
 * Shortens a raw `User-Agent` header to the browser and operating system it
 * names, e.g. `Chrome 141, macOS`.
 *
 * The audit trail stores the header verbatim — that is the evidence, and it
 * stays in the database untouched. What the printed Prüfprotokoll shows is
 * this summary instead, for two reasons:
 *
 *  - A modern header runs to well over a hundred characters of version
 *    tokens that exist to satisfy other sites' sniffing, and pasting one
 *    into a table on A4 would push every other column off the page.
 *    Browser and OS are the part a reader of the certificate can actually
 *    use.
 *  - The finished PDF goes to the adopter and is kept for years. A major
 *    version and an OS name make the same evidentiary point as the full
 *    header — this signature came from this kind of device — while carrying
 *    far less of the fingerprint the full string is built out of.
 *
 * Detection is deliberately a short list of the browsers real signers use,
 * not a general-purpose parser: an unrecognised header summarises to the
 * part that was recognised, or to null, and the trail shows a dash. Being
 * silent about a device is fine here; being wrong about one is not.
 */
class UserAgentSummary
{
    /**
     * Browser name by pattern, each capturing the major version.
     *
     * Order is the whole trick: every Chromium browser also says `Chrome`
     * and nearly everything says `Safari`, so the specific brands have to be
     * tested before the families they are built on. On iOS every browser is
     * Safari's engine under a brand prefix (`CriOS`, `FxiOS`, `EdgiOS`),
     * which those prefixes below pick up.
     */
    private const BROWSERS = [
        'Edge' => '/\bEdg(?:iOS|A)?\/(\d+)/',
        'Opera' => '/\b(?:OPR|OPiOS)\/(\d+)/',
        'Samsung Internet' => '/\bSamsungBrowser\/(\d+)/',
        'Firefox' => '/\b(?:Firefox|FxiOS)\/(\d+)/',
        'Chrome' => '/\b(?:Chrome|CriOS)\/(\d+)/',
        'Safari' => '/\bVersion\/(\d+)[\d.]*(?: Mobile\/\S+)? Safari\b/',
    ];

    /**
     * Operating system by pattern. Android before Linux, which it reports
     * itself as; iPhone/iPad before macOS for the same reason.
     */
    private const SYSTEMS = [
        'Android' => '/\bAndroid\b/',
        'iOS' => '/\b(?:iPhone|iPad|iPod)\b/',
        'Windows' => '/\bWindows NT\b/',
        'macOS' => '/\b(?:Macintosh|Mac OS X)\b/',
        'Linux' => '/\b(?:Linux|X11)\b/',
    ];

    /**
     * The summary for a stored header, or null when nothing in it was
     * recognised — including the null and empty headers written for events
     * no browser triggered.
     */
    public static function summarize(?string $userAgent): ?string
    {
        if ($userAgent === null || trim($userAgent) === '') {
            return null;
        }

        $browser = self::browser($userAgent);
        $system = self::system($userAgent);

        return match (true) {
            $browser !== null && $system !== null => "{$browser}, {$system}",
            default => $browser ?? $system,
        };
    }

    private static function browser(string $userAgent): ?string
    {
        foreach (self::BROWSERS as $name => $pattern) {
            if (preg_match($pattern, $userAgent, $matches) === 1) {
                return "{$name} {$matches[1]}";
            }
        }

        return null;
    }

    private static function system(string $userAgent): ?string
    {
        foreach (self::SYSTEMS as $name => $pattern) {
            if (preg_match($pattern, $userAgent) === 1) {
                return $name;
            }
        }

        return null;
    }
}
