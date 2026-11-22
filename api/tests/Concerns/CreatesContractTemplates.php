<?php

namespace Taily\Tests\Concerns;

use Database\Seeders\ContractTemplateSeeder;
use Taily\Models\Adoption;
use Taily\Models\AnimalType;
use Taily\Models\ContractTemplate;

/**
 * The seeded example Schutzvertrag of the given adoption's (or animal
 * type's) type. Repeated calls reuse the type's template. Adopter
 * fields the type's catalogue doesn't define are neither required nor
 * printed.
 */
trait CreatesContractTemplates
{
    protected function contractTemplate(Adoption|AnimalType $for): ContractTemplate
    {
        $animalTypeId = $for instanceof Adoption ? $for->animal()->value('animal_type_id') : $for->id;

        return ContractTemplate::where('animal_type_id', $animalTypeId)->firstWhere('name', ContractTemplateSeeder::DEFAULT['name'])
            ?? ContractTemplate::create([...ContractTemplateSeeder::DEFAULT, 'animal_type_id' => $animalTypeId]);
    }
}
