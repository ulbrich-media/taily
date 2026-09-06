<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\Organization;
use Taily\Models\Person;
use Taily\Support\ContractPdfService;
use Taily\Tests\TestCase;

class ContractPdfServiceTest extends TestCase
{
    use RefreshDatabase;

    private function createAdoption(bool $withMediator = true, bool $withOrganization = true): Adoption
    {
        $animalType = AnimalType::create(['title' => 'Hund']);

        $animal = Animal::create([
            'animal_type_id' => $animalType->id,
            'name' => 'Bello',
            'gender' => 'male',
        ]);

        $mediatorId = null;
        if ($withMediator) {
            $organizationId = null;
            if ($withOrganization) {
                $organizationId = Organization::create(['name' => 'Tierheim Musterstadt'])->id;
            }

            $mediatorId = Person::create([
                'first_name' => 'Maria',
                'last_name' => 'Vermittlerin',
                'organization_id' => $organizationId,
            ])->id;
        }

        $applicant = Person::create([
            'first_name' => 'Anna',
            'last_name' => 'Übernehmerin',
        ]);

        return Adoption::create([
            'animal_id' => $animal->id,
            'mediator_id' => $mediatorId,
            'applicant_id' => $applicant->id,
            'contract_signed' => false,
        ]);
    }

    public function test_generate_renders_a_pdf_when_mediator_has_an_organization(): void
    {
        $adoption = $this->createAdoption(withMediator: true, withOrganization: true);

        $pdf = (new ContractPdfService)->generate($adoption, 'default');

        $this->assertStringStartsWith('%PDF', $pdf);
    }

    public function test_generate_renders_a_pdf_when_adoption_has_no_mediator(): void
    {
        $adoption = $this->createAdoption(withMediator: false);

        $pdf = (new ContractPdfService)->generate($adoption, 'default');

        $this->assertStringStartsWith('%PDF', $pdf);
    }

    public function test_generate_renders_a_pdf_when_mediator_has_no_organization(): void
    {
        $adoption = $this->createAdoption(withMediator: true, withOrganization: false);

        $pdf = (new ContractPdfService)->generate($adoption, 'default');

        $this->assertStringStartsWith('%PDF', $pdf);
    }

    public function test_generate_throws_for_an_unknown_template_key(): void
    {
        $adoption = $this->createAdoption();

        $this->expectException(NotFoundHttpException::class);

        (new ContractPdfService)->generate($adoption, 'unknown');
    }

    public function test_generate_resolves_a_template_key_containing_a_dot(): void
    {
        // A key like "regional.v1" must be looked up literally, not treated
        // as a nested config path ("contracts.regional.v1") by config().
        config(['taily.contracts' => array_merge(config('taily.contracts'), [
            'regional.v1' => ['label' => 'Regional', 'view' => 'contracts.default'],
        ])]);

        $adoption = $this->createAdoption();

        $pdf = (new ContractPdfService)->generate($adoption, 'regional.v1');

        $this->assertStringStartsWith('%PDF', $pdf);
    }

    public function test_filename_includes_a_slugified_animal_name_and_the_adoption_id(): void
    {
        $adoption = $this->createAdoption();

        $filename = (new ContractPdfService)->filename($adoption);

        $this->assertSame("schutzvertrag-bello-{$adoption->id}.pdf", $filename);
    }
}
