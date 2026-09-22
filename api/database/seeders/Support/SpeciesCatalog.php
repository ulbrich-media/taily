<?php

namespace Database\Seeders\Support;

/**
 * The vocabulary behind the seeded animals, one entry per animal type.
 *
 * Adding a species is a matter of adding an entry here — AnimalTypeSeeder
 * creates the type with its vaccinations and medical tests from it, and
 * AnimalSeeder generates the animals from the same entry.
 */
class SpeciesCatalog
{
    /**
     * @return array<string, array<string, mixed>>
     */
    public static function all(): array
    {
        return [
            'dogs' => [
                'title' => 'Hund',
                'number_prefix' => 'DOG',
                'vaccinations' => [
                    ['title' => 'Tollwut', 'description' => ''],
                    ['title' => 'Borreliose', 'description' => ''],
                    ['title' => 'DHPPi-L', 'description' => 'Staupe, Hepatitis, Parvovirose, Parainfluenza & Leptospirose'],
                ],
                'medical_tests' => [
                    ['title' => 'Leishmaniose', 'description' => ''],
                    ['title' => '4D Snap Test', 'description' => 'Kombinationstest für Heartworm, Ehrlichia, Anaplasma & Borrelia'],
                ],
                'names' => [
                    'Max', 'Bella', 'Rocky', 'Luna', 'Bruno', 'Lilly', 'Buddy', 'Maja',
                    'Rex', 'Emma', 'Sam', 'Nala', 'Lucky', 'Coco', 'Balu', 'Mila',
                    'Leo', 'Susi', 'Charlie', 'Greta', 'Oscar', 'Frieda', 'Paul', 'Hanna',
                ],
                'breeds' => [
                    'Labrador Retriever', 'Deutscher Schäferhund', 'Golden Retriever',
                    'Beagle', 'Dackel', 'Border Collie', 'Boxer', 'Rottweiler', 'Pudel',
                    'Französische Bulldogge', 'Mischling', 'Jack Russell Terrier',
                    'Australian Shepherd', 'Husky', 'Chihuahua',
                ],
                'weight_grams' => [5000, 50000],
                'size_cm' => [25, 80],
                'adoption_fee' => [200, 450],
                'boarding_cost' => [50, 200],
                'sponsorship' => [20, 100],
                'compatibilities' => [
                    'Katzen', 'Kinder', 'andere Hunde', 'Kleintiere',
                    'Männer', 'Frauen', 'Senioren', 'erfahrene Halter',
                ],
                'compatibility_count' => [1, 4],
                'personality_traits' => [
                    'verspielt', 'verschmust', 'aktiv', 'ruhig', 'Jagdtrieb',
                    'ängstlich', 'dominant', 'selbstständig', 'anhänglich',
                    'lernfreudig', 'ausgeglichen', 'wachsam',
                ],
                'personality_trait_count' => [2, 5],
                'image_directory' => 'dogs',
            ],

            'cats' => [
                'title' => 'Katze',
                'number_prefix' => 'CAT',
                'vaccinations' => [
                    ['title' => 'Tollwut', 'description' => ''],
                    ['title' => 'Katzenschnupfen', 'description' => 'Herpes- & Calicivirus'],
                    ['title' => 'Katzenseuche', 'description' => 'Feline Panleukopenie'],
                ],
                'medical_tests' => [
                    ['title' => 'FIV', 'description' => 'Felines Immundefizienz-Virus'],
                    ['title' => 'FeLV', 'description' => 'Felines Leukämievirus'],
                ],
                'names' => [
                    'Mia', 'Felix', 'Luna', 'Simba', 'Lilly', 'Garfield', 'Nala', 'Tiger',
                    'Minnie', 'Leo', 'Lucy', 'Sammy', 'Mimi', 'Whisker', 'Kitty', 'Shadow',
                ],
                'breeds' => [
                    'Europäisch Kurzhaar', 'Perser', 'Maine Coon', 'Britisch Kurzhaar',
                    'Siamkatze', 'Norwegische Waldkatze', 'Bengal', 'Ragdoll',
                    'Mischling', 'Hauskatze',
                ],
                'weight_grams' => [2000, 7000],
                'size_cm' => [20, 35],
                'adoption_fee' => [150, 350],
                'boarding_cost' => [40, 150],
                'sponsorship' => [15, 80],
                'compatibilities' => [
                    'Kinder', 'andere Katzen', 'Hunde', 'ruhige Umgebung',
                    'Wohnungshaltung geeignet', 'Freigänger geeignet',
                ],
                'compatibility_count' => [1, 3],
                'personality_traits' => [
                    'verschmust', 'verspielt', 'neugierig', 'scheu',
                    'selbstständig', 'anhänglich', 'ruhig', 'aktiv',
                ],
                'personality_trait_count' => [2, 4],
                'image_directory' => 'cats',
            ],
        ];
    }

    /**
     * Colours apply to every species.
     *
     * @return list<string>
     */
    public static function colors(): array
    {
        return [
            'Schwarz', 'Weiß', 'Braun', 'Golden', 'Grau', 'Schwarz-Weiß',
            'Braun-Weiß', 'Tricolor', 'Gestromt', 'Rot', 'Creme',
        ];
    }

    /**
     * @return list<string>
     */
    public static function originCountries(): array
    {
        return [
            'Deutschland', 'Spanien', 'Griechenland', 'Rumänien', 'Bulgarien',
            'Portugal', 'Italien', 'Türkei', 'Ungarn', 'Polen',
        ];
    }

    /**
     * @return list<string>
     */
    public static function locations(): array
    {
        return [
            'Berlin', 'München', 'Hamburg', 'Köln', 'Frankfurt', 'Stuttgart',
            'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden',
        ];
    }

    /**
     * @return list<string>
     */
    public static function originOrganizations(): array
    {
        return [
            'Tierschutzverein München e.V.',
            'Tierheim Berlin',
            'Pfotenhilfe Spanien',
            'Hundeengel Griechenland',
            'Straßenhunde Rumänien e.V.',
        ];
    }
}
