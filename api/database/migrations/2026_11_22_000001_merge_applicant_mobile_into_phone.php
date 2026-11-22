<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * An applicant has one phone number, mobile or landline (ADR-018). A mobile
 * number moves into an empty phone field; when both were given, the phone
 * field keeps both. The built-in "Mobil" field leaves every catalogue and
 * every contract template.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('adoptions')
            ->where('applicant_mobile', '!=', '')
            ->orderBy('id')
            ->each(function (object $adoption) {
                $phone = match (true) {
                    $adoption->applicant_phone === '' => $adoption->applicant_mobile,
                    $adoption->applicant_phone === $adoption->applicant_mobile => $adoption->applicant_phone,
                    default => "{$adoption->applicant_phone} / {$adoption->applicant_mobile}",
                };

                DB::table('adoptions')->where('id', $adoption->id)->update(['applicant_phone' => $phone]);
            });

        Schema::table('adoptions', function (Blueprint $table) {
            $table->dropColumn('applicant_mobile');
        });

        // Requirement overrides of the field go with it (cascade).
        DB::table('field_definitions')->where('applicant_attribute', 'mobile')->delete();

        foreach (DB::table('contract_templates')->get(['id', 'adopter_fields']) as $template) {
            $fields = json_decode($template->adopter_fields, true) ?? [];
            $kept = array_values(array_filter($fields, fn (array $entry) => ($entry['key'] ?? null) !== 'mobile'));

            if (count($kept) !== count($fields)) {
                DB::table('contract_templates')->where('id', $template->id)->update(['adopter_fields' => json_encode($kept)]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('adoptions', function (Blueprint $table) {
            $table->string('applicant_mobile')->default('')->after('applicant_phone');
        });
    }
};
