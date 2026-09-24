<?php

namespace Taily\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Taily\Support\UserAgentSummary;

class UserAgentSummaryTest extends TestCase
{
    // -------------------------------------------------------------------------
    // The browsers signers actually arrive in
    // -------------------------------------------------------------------------

    public function test_chrome_on_windows(): void
    {
        $this->assertSame('Chrome 141, Windows', UserAgentSummary::summarize(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
        ));
    }

    public function test_safari_on_macos(): void
    {
        $this->assertSame('Safari 18, macOS', UserAgentSummary::summarize(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15'
        ));
    }

    public function test_safari_on_iphone(): void
    {
        $this->assertSame('Safari 18, iOS', UserAgentSummary::summarize(
            'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
        ));
    }

    public function test_firefox_on_linux(): void
    {
        $this->assertSame('Firefox 143, Linux', UserAgentSummary::summarize(
            'Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0'
        ));
    }

    public function test_chrome_on_android(): void
    {
        $this->assertSame('Chrome 141, Android', UserAgentSummary::summarize(
            'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36'
        ));
    }

    public function test_samsung_internet_on_android(): void
    {
        $this->assertSame('Samsung Internet 27, Android', UserAgentSummary::summarize(
            'Mozilla/5.0 (Linux; Android 15; SM-S931B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36'
        ));
    }

    // -------------------------------------------------------------------------
    // Brands that hide behind the engine they are built on
    // -------------------------------------------------------------------------

    public function test_edge_is_not_reported_as_chrome(): void
    {
        $this->assertSame('Edge 141, Windows', UserAgentSummary::summarize(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0'
        ));
    }

    public function test_opera_is_not_reported_as_chrome(): void
    {
        $this->assertSame('Opera 122, macOS', UserAgentSummary::summarize(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 OPR/122.0.0.0'
        ));
    }

    public function test_chrome_on_ios_is_not_reported_as_safari(): void
    {
        $this->assertSame('Chrome 141, iOS', UserAgentSummary::summarize(
            'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.0.0 Mobile/15E148 Safari/604.1'
        ));
    }

    public function test_ipad_is_not_reported_as_macos(): void
    {
        $this->assertSame('Safari 18, iOS', UserAgentSummary::summarize(
            'Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
        ));
    }

    // -------------------------------------------------------------------------
    // Nothing to say, said as nothing
    // -------------------------------------------------------------------------

    public function test_events_without_a_browser_summarize_to_null(): void
    {
        $this->assertNull(UserAgentSummary::summarize(null));
        $this->assertNull(UserAgentSummary::summarize(''));
        $this->assertNull(UserAgentSummary::summarize('   '));
    }

    public function test_unrecognised_header_summarizes_to_null(): void
    {
        $this->assertNull(UserAgentSummary::summarize('curl/8.7.1'));
    }

    public function test_recognised_half_is_kept_when_the_other_half_is_not(): void
    {
        $this->assertSame('Windows', UserAgentSummary::summarize(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SomeUnknownBrowser/3.2'
        ));
        $this->assertSame('Firefox 143', UserAgentSummary::summarize('Firefox/143.0'));
    }
}
