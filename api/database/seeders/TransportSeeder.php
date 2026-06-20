<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Taily\Models\Adoption;
use Taily\Models\Person;
use Taily\Models\Transport;

class TransportSeeder extends Seeder
{
    public function run(): void
    {
        $inProgressAdoptions = Adoption::where('status', 'in_progress')
            ->whereNull('transport_id')
            ->take(2)
            ->get();

        $doneAdoptions = Adoption::where('status', 'done')
            ->whereNull('transport_id')
            ->take(2)
            ->get();

        $mediator = Person::whereHas('mediatorAnimalTypes')->first();

        // Completed transport from a few weeks ago
        $doneTransport = Transport::create([
            'name' => 'Süddeutschland-Tour',
            'planned_at' => Carbon::now('UTC')->subWeeks(2)->toDateString(),
            'notes' => 'Transport verlief reibungslos. Alle Tiere gut angekommen.',
            'responsible_id' => $mediator?->id,
            'transporter' => 'Tierschutzverein München e.V.',
        ]);
        $doneTransport->done_at = Carbon::now('UTC')->subWeeks(2)->addHours(4);
        $doneTransport->save();

        if ($doneAdoptions->isNotEmpty()) {
            $doneAdoptions->each(fn ($adoption) => $adoption->update(['transport_id' => $doneTransport->id]));
        }

        // Upcoming open transport
        $openTransport = Transport::create([
            'planned_at' => Carbon::now('UTC')->addWeeks(2)->toDateString(),
            'notes' => 'Bitte Abholzeit bis Freitag bestätigen.',
            'responsible_id' => $mediator?->id,
            'transporter' => '',
        ]);

        if ($inProgressAdoptions->isNotEmpty()) {
            $inProgressAdoptions->each(fn ($adoption) => $adoption->update(['transport_id' => $openTransport->id]));
        }
    }
}
