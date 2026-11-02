<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Taily\Models\AnimalType;
use Taily\Models\ContractTemplate;

/**
 * The example Schutzvertrag every installation starts with (ADR-016),
 * offered for every animal type. It replaces the Blade template that used
 * to ship as `contracts/default.blade.php`.
 */
class ContractTemplateSeeder extends Seeder
{
    public const DEFAULT = [
        'name' => 'Schutzvertrag (Beispielvorlage)',
        'title' => 'Schutzvertrag',
        'body' => <<<'MD'
            *Hinweis: Dies ist eine Beispielvorlage zu Demonstrationszwecken und kein rechtssicherer, produktionsreifer Vertrag. Vor dem Einsatz muss sie durch eine eigene, rechtlich geprüfte Fassung ersetzt werden.*

            ## Bedingungen

            Der/die Adoptant:in verpflichtet sich, das oben genannte Tier artgerecht zu halten, zu pflegen und tierärztlich zu versorgen.

            Eine Weitergabe an Dritte sowie eine gewerbliche Nutzung des Tieres sind ohne vorherige schriftliche Zustimmung der vermittelnden Organisation untersagt.

            Bei Zuwiderhandlung gegen diesen Vertrag behält sich die vermittelnde Organisation das Recht vor, das Tier zurückzufordern.
            MD,
        'animal_fields' => [
            ['key' => 'animal.name', 'required' => true],
            ['key' => 'animal.animal_type', 'required' => true],
            ['key' => 'animal.breed', 'required' => false],
            ['key' => 'animal.color', 'required' => false],
            ['key' => 'animal.date_of_birth', 'required' => false],
            ['key' => 'animal.animal_number', 'required' => true],
            ['key' => 'animal.photo', 'required' => false],
        ],
        'mediator_fields' => [
            ['key' => 'mediator.full_name', 'required' => true],
            ['key' => 'mediator.organization', 'required' => false],
        ],
        'adopter_fields' => [
            ['key' => 'first_name', 'required' => true],
            ['key' => 'last_name', 'required' => true],
            ['key' => 'date_of_birth', 'required' => true],
            ['key' => 'address', 'required' => true],
            ['key' => 'id_card_number', 'required' => true],
            ['key' => 'email', 'required' => false],
            ['key' => 'phone', 'required' => false],
        ],
    ];

    public function run(): void
    {
        self::createDefault(AnimalType::all());
    }

    /**
     * @param  iterable<AnimalType>  $animalTypes
     */
    public static function createDefault(iterable $animalTypes): ContractTemplate
    {
        $template = ContractTemplate::create(self::DEFAULT);
        $template->animalTypes()->sync(collect($animalTypes)->pluck('id'));

        return $template;
    }
}
