<?php

namespace Taily\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Taily\Enums\ContractSigningStatus;
use Taily\Models\Adoption;
use Taily\Models\Animal;
use Taily\Models\AnimalType;
use Taily\Models\Person;
use Taily\Tests\TestCase;

class AdoptionContractStatusTest extends TestCase
{
    use RefreshDatabase;

    private function createAdoption(bool $contractSigned = false): Adoption
    {
        $animalType = AnimalType::create(['title' => 'Hund']);

        $animal = Animal::create([
            'animal_type_id' => $animalType->id,
            'name' => 'Bello',
            'gender' => 'male',
        ]);

        $mediator = Person::create([
            'first_name' => 'Maria',
            'last_name' => 'Vermittlerin',
            'email' => 'maria@example.com',
        ]);

        $applicant = Person::create([
            'first_name' => 'Anna',
            'last_name' => 'Übernehmerin',
            'email' => 'anna@example.com',
        ]);

        return Adoption::create([
            'animal_id' => $animal->id,
            'mediator_id' => $mediator->id,
            'applicant_id' => $applicant->id,
            'contract_signed' => $contractSigned,
        ]);
    }

    public function test_not_started_when_there_is_no_signing_process_and_contract_is_unsigned(): void
    {
        $adoption = $this->createAdoption();

        $this->assertSame('not_started', $adoption->contract_status);
    }

    public function test_finished_when_contract_is_signed_and_there_is_no_signing_process(): void
    {
        $adoption = $this->createAdoption(contractSigned: true);

        $this->assertSame('finished', $adoption->contract_status);
    }

    public function test_pending_while_awaiting_mediator_signature(): void
    {
        $adoption = $this->createAdoption();

        $adoption->contractSigningProcesses()->create([
            'template_key' => 'default',
            'unsigned_document_hash' => 'hash',
            'status' => ContractSigningStatus::AWAITING_MEDIATOR_SIGNATURE,
        ]);

        $this->assertSame('pending', $adoption->contract_status);
    }

    public function test_pending_while_awaiting_adopter_signature(): void
    {
        $adoption = $this->createAdoption();

        $adoption->contractSigningProcesses()->create([
            'template_key' => 'default',
            'unsigned_document_hash' => 'hash',
            'status' => ContractSigningStatus::AWAITING_ADOPTER_SIGNATURE,
        ]);

        $this->assertSame('pending', $adoption->contract_status);
    }

    public function test_not_started_when_the_latest_process_was_cancelled(): void
    {
        $adoption = $this->createAdoption();

        $adoption->contractSigningProcesses()->create([
            'template_key' => 'default',
            'unsigned_document_hash' => 'hash',
            'status' => ContractSigningStatus::CANCELLED,
        ]);

        $this->assertSame('not_started', $adoption->contract_status);
    }

    public function test_not_started_when_the_latest_process_has_expired(): void
    {
        $adoption = $this->createAdoption();

        $adoption->contractSigningProcesses()->create([
            'template_key' => 'default',
            'unsigned_document_hash' => 'hash',
            'status' => ContractSigningStatus::EXPIRED,
        ]);

        $this->assertSame('not_started', $adoption->contract_status);
    }

    public function test_finished_when_the_latest_process_is_completed_and_contract_is_signed(): void
    {
        $adoption = $this->createAdoption(contractSigned: true);

        $adoption->contractSigningProcesses()->create([
            'template_key' => 'default',
            'unsigned_document_hash' => 'hash',
            'status' => ContractSigningStatus::COMPLETED,
        ]);

        $this->assertSame('finished', $adoption->contract_status);
    }
}
