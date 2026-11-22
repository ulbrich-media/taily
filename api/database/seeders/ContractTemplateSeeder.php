<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Taily\Models\AnimalType;
use Taily\Models\ContractTemplate;

/**
 * The example Schutzvertrag every installation starts with (ADR-017), one
 * copy per animal type. It replaces the Blade template that used
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
        // The parties' names, the adopter's email and address and the
        // animal's photo are fixed fields every contract prints.
        'animal_fields' => [
            ['key' => 'animal.animal_type', 'required' => true],
            ['key' => 'animal.breed', 'required' => false],
            ['key' => 'animal.color', 'required' => false],
            ['key' => 'animal.date_of_birth', 'required' => false],
            ['key' => 'animal.animal_number', 'required' => true],
        ],
        'mediator_fields' => [],
        'adopter_fields' => [
            ['key' => 'date_of_birth', 'required' => true],
            ['key' => 'id_card_number', 'required' => true],
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
    public static function createDefault(iterable $animalTypes): void
    {
        foreach ($animalTypes as $animalType) {
            self::createDefaultFor($animalType);
        }
    }

    public static function createDefaultFor(AnimalType $animalType): ContractTemplate
    {
        return ContractTemplate::create([...self::DEFAULT, 'animal_type_id' => $animalType->id]);
    }
}
