<?php

namespace Taily\Tests\Unit;

use Database\Seeders\Support\SeedMail;
use PHPUnit\Framework\TestCase;

class SeedMailTest extends TestCase
{
    public function test_it_derives_a_person_address_from_their_name(): void
    {
        $mail = new SeedMail;

        $this->assertSame('john.doe@local.local', $mail->forPerson('John', 'Doe'));
    }

    public function test_it_expands_umlauts_instead_of_dropping_them(): void
    {
        $mail = new SeedMail;

        $this->assertSame('joerg.mueller@local.local', $mail->forPerson('Jörg', 'Müller'));
        $this->assertSame('anna.strauss@local.local', $mail->forPerson('Anna', 'Strauß'));
    }

    public function test_it_derives_an_organization_address_from_its_name(): void
    {
        $mail = new SeedMail;

        $this->assertSame(
            'tierschutzverein-muenchen@local.local',
            $mail->forOrganization('Tierschutzverein München')
        );
    }

    public function test_it_keeps_addresses_unique_with_a_numeric_suffix(): void
    {
        $mail = new SeedMail;

        $first = $mail->forPerson('John', 'Doe');
        $second = $mail->forPerson('John', 'Doe');

        $this->assertSame('john.doe@local.local', $first);
        $this->assertNotSame($first, $second);
        $this->assertMatchesRegularExpression('/^john\.doe\d{4}@local\.local$/', $second);
    }

    public function test_every_address_lands_on_a_domain_that_cannot_receive_mail(): void
    {
        $mail = new SeedMail;

        $this->assertStringEndsWith('@local.local', $mail->forPerson('Any', 'Body'));
        $this->assertStringEndsWith('@local.local', $mail->forOrganization('Any Club'));
    }

    public function test_it_falls_back_when_a_name_has_no_usable_characters(): void
    {
        $mail = new SeedMail;

        $this->assertSame('kontakt.kontakt@local.local', $mail->forPerson('—', '—'));
    }
}
