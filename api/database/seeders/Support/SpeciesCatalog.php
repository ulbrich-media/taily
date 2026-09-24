<?php

namespace Database\Seeders\Support;

use Faker\Generator;

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

                // Core vaccinations plus the ones that matter for dogs coming
                // out of southern and eastern Europe.
                'vaccinations' => [
                    ['title' => 'Tollwut', 'description' => 'Pflichtimpfung für die Einreise'],
                    ['title' => 'DHPPi-L', 'description' => 'Staupe, Hepatitis, Parvovirose, Parainfluenza & Leptospirose'],
                    ['title' => 'Borreliose', 'description' => 'Zeckenübertragene Borrelia-Infektion'],
                    ['title' => 'Zwingerhusten', 'description' => 'Bordetella bronchiseptica & Parainfluenza'],
                    ['title' => 'Leishmaniose', 'description' => 'Schutzimpfung für Hunde aus dem Mittelmeerraum'],
                    ['title' => 'Babesiose', 'description' => 'Auch Hundemalaria genannt'],
                ],

                // The "Mittelmeerkrankheiten" panel most rescue dogs are
                // tested for, plus the routine checks.
                'medical_tests' => [
                    ['title' => 'Leishmaniose', 'description' => 'Antikörpertest'],
                    ['title' => '4D Snap Test', 'description' => 'Kombinationstest für Herzwurm, Ehrlichia, Anaplasma & Borrelia'],
                    ['title' => 'Ehrlichiose', 'description' => 'Zeckenübertragene Ehrlichia-Infektion'],
                    ['title' => 'Babesiose', 'description' => 'Blutausstrich oder PCR'],
                    ['title' => 'Herzwurm', 'description' => 'Dirofilaria immitis, Antigentest'],
                    ['title' => 'Hepatozoonose', 'description' => 'Übertragung durch verschluckte Zecken'],
                    ['title' => 'Brucellose', 'description' => 'Brucella canis, vor der Kastration'],
                    ['title' => 'Kotprobe', 'description' => 'Giardien, Würmer & Kokzidien'],
                    ['title' => 'Blutbild', 'description' => 'Großes Blutbild inkl. Organwerte'],
                ],

                'names' => [
                    // German shelter classics
                    'Max', 'Bella', 'Rocky', 'Luna', 'Bruno', 'Lilly', 'Buddy', 'Maja',
                    'Rex', 'Emma', 'Sam', 'Nala', 'Lucky', 'Coco', 'Balu', 'Mila',
                    'Leo', 'Susi', 'Charlie', 'Greta', 'Oscar', 'Frieda', 'Paul', 'Hanna',
                    'Nando', 'Ronja', 'Fiete', 'Wilma', 'Ole', 'Elsa', 'Kurt', 'Berta',
                    'Emil', 'Ida', 'Otto', 'Lotte', 'Hugo', 'Alma', 'Fritz', 'Käthe',
                    'Jonny', 'Molly', 'Rudi', 'Pepper', 'Anton', 'Kira', 'Bär', 'Nelly',
                    'Ben', 'Amy', 'Jack', 'Ruby', 'Toby', 'Daisy', 'Finn', 'Lissi',
                    'Gino', 'Wolke', 'Nero', 'Perle', 'Zorro', 'Mia', 'Rocco', 'Peppa',
                    'Akira', 'Shiva', 'Tarik', 'Zara', 'Simba', 'Kaya', 'Bosco', 'Nuri',
                    // Names they arrived with from abroad
                    'Paco', 'Lola', 'Chico', 'Nina', 'Rico', 'Bonita', 'Tico', 'Estrella',
                    'Milo', 'Dana', 'Vasco', 'Mara', 'Enzo', 'Sofia', 'Dino', 'Lira',
                    'Pablo', 'Carla', 'Sammy', 'Roxy', 'Bruma', 'Tessa', 'Aslan', 'Maya',
                    'Timur', 'Belka', 'Radu', 'Anuk', 'Vlad', 'Stella', 'Ilias', 'Athina',
                    'Kostas', 'Elli', 'Nikos', 'Dora', 'Yuki', 'Pina', 'Loki', 'Freya',
                    'Balou', 'Sina', 'Django', 'Juno', 'Ozzy', 'Ayla', 'Benno', 'Nora',
                ],

                'breeds' => [
                    // Most shelter dogs are mixes; a pedigree is the exception.
                    'common' => ['Mischling' => 34],
                    'mix_bases' => [
                        'Schäferhund', 'Labrador', 'Terrier', 'Jagdhund', 'Herdenschutzhund',
                        'Podenco', 'Galgo', 'Husky', 'Border-Collie', 'Beagle', 'Spitz',
                        'Pinscher', 'Dackel', 'Pudel', 'Boxer', 'Rottweiler', 'Mastin',
                        'Windhund', 'Bodeguero', 'Retriever', 'Malinois', 'Schnauzer',
                    ],
                    'mix_weight' => 40,
                    'purebred' => [
                        'Labrador Retriever', 'Deutscher Schäferhund', 'Golden Retriever',
                        'Beagle', 'Dackel', 'Border Collie', 'Boxer', 'Rottweiler', 'Pudel',
                        'Französische Bulldogge', 'Jack Russell Terrier', 'Australian Shepherd',
                        'Siberian Husky', 'Chihuahua', 'Podenco Andaluz', 'Galgo Español',
                        'Cane Corso', 'Malinois', 'Weimaraner', 'Magyar Vizsla',
                        'Kangal', 'Mastín Español', 'Shih Tzu', 'Cocker Spaniel',
                    ],
                    'purebred_weight' => 26,
                ],

                'weight_grams' => [5000, 50000],
                'size_cm' => [25, 80],
                'adoption_fee' => [200, 450],
                'boarding_cost' => [50, 200],
                'sponsorship' => [20, 100],
                'compatibilities' => [
                    'Katzen', 'Kinder', 'andere Hunde', 'Kleintiere',
                    'Männer', 'Frauen', 'Senioren', 'erfahrene Halter',
                    'Anfänger', 'Stadtwohnung', 'Haus mit Garten', 'Autofahren',
                ],
                'compatibility_count' => [1, 4],
                'personality_traits' => [
                    'verspielt', 'verschmust', 'aktiv', 'ruhig', 'Jagdtrieb',
                    'ängstlich', 'dominant', 'selbstständig', 'anhänglich',
                    'lernfreudig', 'ausgeglichen', 'wachsam', 'sensibel',
                    'menschenbezogen', 'unsicher', 'neugierig', 'sportlich',
                ],
                'personality_trait_count' => [2, 5],
                'image_directory' => 'dogs',
            ],

            'cats' => [
                'title' => 'Katze',
                'number_prefix' => 'CAT',

                'vaccinations' => [
                    ['title' => 'Tollwut', 'description' => 'Pflichtimpfung für die Einreise'],
                    ['title' => 'Katzenschnupfen', 'description' => 'Herpes- & Calicivirus'],
                    ['title' => 'Katzenseuche', 'description' => 'Feline Panleukopenie'],
                    ['title' => 'Leukose', 'description' => 'FeLV, vor allem für Freigänger'],
                    ['title' => 'Chlamydien', 'description' => 'Chlamydophila felis'],
                ],

                'medical_tests' => [
                    ['title' => 'FIV', 'description' => 'Felines Immundefizienz-Virus, auch Katzenaids'],
                    ['title' => 'FeLV', 'description' => 'Felines Leukämievirus'],
                    ['title' => 'Coronavirus-Titer', 'description' => 'Abklärung FIP-Risiko'],
                    ['title' => 'Toxoplasmose', 'description' => 'Antikörpertest'],
                    ['title' => 'Kotprobe', 'description' => 'Giardien, Würmer & Kokzidien'],
                    ['title' => 'Nierenwerte', 'description' => 'Blutbild inkl. Harnstoff & Kreatinin'],
                ],

                'names' => [
                    'Mia', 'Felix', 'Luna', 'Simba', 'Lilly', 'Garfield', 'Nala', 'Tiger',
                    'Minnie', 'Leo', 'Lucy', 'Sammy', 'Mimi', 'Kitty', 'Shadow', 'Pauli',
                    'Molly', 'Balu', 'Cleo', 'Moritz', 'Nelli', 'Oskar', 'Rosa', 'Theo',
                    'Snowy', 'Miez', 'Muffin', 'Pepsi', 'Chili', 'Zimt', 'Mocca', 'Keks',
                    'Pünktchen', 'Fluse', 'Socke', 'Schnurri', 'Tapsi', 'Wuschel',
                    'Jamie', 'Nero', 'Isis', 'Ramses', 'Kleopatra', 'Pharao', 'Sushi',
                    'Yuki', 'Miso', 'Nori', 'Momo', 'Taro', 'Kiwi', 'Mango', 'Papaya',
                    'Frida', 'Carlo', 'Enzo', 'Bella', 'Rocco', 'Gina', 'Aldo', 'Pina',
                    'Elli', 'Fritzi', 'Hanni', 'Nanni', 'Emmi', 'Lotti', 'Mausi', 'Purzel',
                ],

                'breeds' => [
                    // The shelter cat is almost always a domestic shorthair.
                    'common' => [
                        'Europäisch Kurzhaar' => 38,
                        'Hauskatze' => 22,
                        'Mischling' => 8,
                    ],
                    'mix_bases' => [
                        'Perser', 'Maine-Coon', 'Siam', 'BKH',
                        'Waldkatzen', 'Bengal', 'Angora',
                    ],
                    'mix_weight' => 14,
                    'purebred' => [
                        'Perser', 'Maine Coon', 'Britisch Kurzhaar', 'Siamkatze',
                        'Norwegische Waldkatze', 'Bengal', 'Ragdoll', 'Russisch Blau',
                        'Heilige Birma', 'Sibirische Katze', 'Kartäuser', 'Abessinier',
                    ],
                    'purebred_weight' => 18,
                ],

                'weight_grams' => [2000, 7000],
                'size_cm' => [20, 35],
                'adoption_fee' => [150, 350],
                'boarding_cost' => [40, 150],
                'sponsorship' => [15, 80],
                'compatibilities' => [
                    'Kinder', 'andere Katzen', 'Hunde', 'ruhige Umgebung',
                    'Wohnungshaltung geeignet', 'Freigänger geeignet',
                    'gesicherter Balkon', 'Zweitkatze erwünscht', 'Einzelhaltung',
                ],
                'compatibility_count' => [1, 3],
                'personality_traits' => [
                    'verschmust', 'verspielt', 'neugierig', 'scheu',
                    'selbstständig', 'anhänglich', 'ruhig', 'aktiv',
                    'gesprächig', 'eigenwillig', 'menschenbezogen', 'zurückhaltend',
                ],
                'personality_trait_count' => [2, 4],
                'image_directory' => 'cats',
            ],
        ];
    }

    /**
     * Picks a breed the way a shelter's records actually look: mostly mixes,
     * a pedigree now and then.
     *
     * @param  array<string, mixed>  $breeds  the species' `breeds` entry
     */
    public static function pickBreed(array $breeds, Generator $faker): string
    {
        // Weights are percentages, counted in hundredths so that a group's
        // share still divides across its entries without rounding to nothing.
        $options = [];

        foreach ($breeds['common'] ?? [] as $breed => $weight) {
            $options[$breed] = (int) $weight * 100;
        }

        self::spread($options, $breeds['mix_bases'] ?? [], $breeds['mix_weight'] ?? 0, '%s-Mischling');
        self::spread($options, $breeds['purebred'] ?? [], $breeds['purebred_weight'] ?? 0, '%s');

        return self::weighted($options, $faker);
    }

    /**
     * Divides a group's share over its entries.
     *
     * @param  array<string, int>  $options
     * @param  list<string>  $entries
     */
    private static function spread(array &$options, array $entries, int $groupWeight, string $format): void
    {
        if ($entries === []) {
            return;
        }

        $each = max(1, intdiv($groupWeight * 100, count($entries)));

        foreach ($entries as $entry) {
            $options[sprintf($format, $entry)] = $each;
        }
    }

    /**
     * @param  array<string, int>  $options
     */
    private static function weighted(array $options, Generator $faker): string
    {
        $draw = $faker->numberBetween(1, max(1, array_sum($options)));

        foreach ($options as $value => $weight) {
            $draw -= $weight;

            if ($draw <= 0) {
                return (string) $value;
            }
        }

        return (string) array_key_first($options);
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
            'Braun-Weiß', 'Tricolor', 'Gestromt', 'Rot', 'Creme', 'Beige',
            'Sandfarben', 'Silber', 'Blau-Grau', 'Rot-Weiß', 'Gefleckt',
            'Getigert', 'Schildpatt', 'Merle',
        ];
    }

    /**
     * @return list<string>
     */
    public static function originCountries(): array
    {
        return [
            'Deutschland', 'Spanien', 'Griechenland', 'Rumänien', 'Bulgarien',
            'Portugal', 'Italien', 'Türkei', 'Ungarn', 'Polen', 'Zypern',
            'Nordmazedonien', 'Serbien', 'Kroatien',
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
            'Hannover', 'Nürnberg', 'Münster', 'Augsburg', 'Kiel', 'Freiburg',
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
            'Protectora Almería',
            'Refugio Esperanza',
            'Animal Rescue Bulgaria',
            'Katzenhilfe Zypern',
            'Tierhilfe Südost e.V.',
        ];
    }
}
