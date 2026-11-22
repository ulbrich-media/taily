<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * A contract template belongs to exactly one animal type (ADR-017). A
 * template offered for several types is copied once per further type, so
 * every type keeps the templates it had. A template offered for none was
 * never available; it is kept, archived, on the first animal type.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contract_templates', function (Blueprint $table) {
            $table->foreignUuid('animal_type_id')->nullable()->after('id')->constrained('animal_types')->cascadeOnDelete();
        });

        $typeTitles = DB::table('animal_types')->pluck('title', 'id');
        $firstType = $typeTitles->sort()->keys()->first();

        foreach (DB::table('contract_templates')->get() as $template) {
            $typeIds = DB::table('animal_type_contract_template')
                ->where('contract_template_id', $template->id)
                ->pluck('animal_type_id')
                ->sortBy(fn (string $id) => $typeTitles[$id] ?? '')
                ->values();

            if ($typeIds->isEmpty()) {
                if ($firstType === null) {
                    DB::table('contract_templates')->where('id', $template->id)->delete();

                    continue;
                }

                DB::table('contract_templates')->where('id', $template->id)->update([
                    'animal_type_id' => $firstType,
                    'archived_at' => $template->archived_at ?? now(),
                ]);

                continue;
            }

            DB::table('contract_templates')->where('id', $template->id)->update(['animal_type_id' => $typeIds->first()]);

            foreach ($typeIds->slice(1) as $typeId) {
                DB::table('contract_templates')->insert([
                    ...(array) $template,
                    'id' => (string) Str::uuid(),
                    'animal_type_id' => $typeId,
                ]);
            }
        }

        Schema::table('contract_templates', function (Blueprint $table) {
            $table->foreignUuid('animal_type_id')->nullable(false)->change();
        });

        Schema::dropIfExists('animal_type_contract_template');
    }

    public function down(): void
    {
        Schema::create('animal_type_contract_template', function (Blueprint $table) {
            $table->foreignUuid('animal_type_id')->constrained('animal_types')->cascadeOnDelete();
            $table->foreignUuid('contract_template_id')->constrained('contract_templates')->cascadeOnDelete();
            $table->primary(['animal_type_id', 'contract_template_id']);
        });

        foreach (DB::table('contract_templates')->get(['id', 'animal_type_id']) as $template) {
            DB::table('animal_type_contract_template')->insert([
                'animal_type_id' => $template->animal_type_id,
                'contract_template_id' => $template->id,
            ]);
        }

        Schema::table('contract_templates', function (Blueprint $table) {
            $table->dropConstrainedForeignId('animal_type_id');
        });
    }
};
