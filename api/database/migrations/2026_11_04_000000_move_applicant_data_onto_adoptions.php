<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Applicant data on the adoption (ADR-018): the applicant's identity moves
 * from the Person into fixed adoption columns, the Person becomes an
 * optional reference, and contract signers keep their own name and email.
 * The applicant has one phone number; a Person's mobile number is taken
 * when they have no other.
 */
return new class extends Migration
{
    private const PARTS = ['first_name', 'last_name', 'email', 'phone', 'street_line', 'street_line_additional', 'postal_code', 'city', 'country_code'];

    public function up(): void
    {
        Schema::table('adoptions', function (Blueprint $table) {
            $table->string('applicant_first_name')->default('')->after('applicant_id');
            $table->string('applicant_last_name')->default('')->after('applicant_first_name');
            $table->string('applicant_email')->default('')->after('applicant_last_name')->index();
            $table->string('applicant_phone')->default('')->after('applicant_email');
            $table->date('applicant_date_of_birth')->nullable()->after('applicant_phone');
            $table->string('applicant_street_line')->default('')->after('applicant_date_of_birth');
            $table->string('applicant_street_line_additional')->default('')->after('applicant_street_line');
            $table->string('applicant_postal_code')->default('')->after('applicant_street_line_additional');
            $table->string('applicant_city')->default('')->after('applicant_postal_code');
            $table->string('applicant_country_code')->default('')->after('applicant_city');
        });

        // Copy what the Persons hold, so existing adoptions keep their data.
        foreach (DB::table('adoptions')->join('people', 'people.id', '=', 'adoptions.applicant_id')->select('adoptions.id', 'people.*')->get() as $row) {
            $values = ['applicant_date_of_birth' => $row->date_of_birth];

            foreach (self::PARTS as $part) {
                $values["applicant_{$part}"] = $part === 'email' ? mb_strtolower(trim((string) $row->email)) : (string) ($row->{$part} ?? '');
            }

            if ($values['applicant_phone'] === '') {
                $values['applicant_phone'] = (string) ($row->mobile ?? '');
            }

            DB::table('adoptions')->where('id', $row->id)->update($values);
        }

        Schema::table('adoptions', function (Blueprint $table) {
            $table->dropForeign(['applicant_id']);
            $table->renameColumn('applicant_id', 'applicant_person_id');
        });

        Schema::table('adoptions', function (Blueprint $table) {
            $table->uuid('applicant_person_id')->nullable()->change();
            $table->foreign('applicant_person_id')->references('id')->on('people')->nullOnDelete();
        });

        Schema::table('field_definitions', function (Blueprint $table) {
            $table->renameColumn('person_attribute', 'applicant_attribute');
        });

        Schema::table('contract_signers', function (Blueprint $table) {
            $table->string('name')->default('')->after('person_id');
            $table->string('email')->default('')->after('name');
        });

        foreach (DB::table('contract_signers')->join('people', 'people.id', '=', 'contract_signers.person_id')->select('contract_signers.id', 'people.first_name', 'people.last_name', 'people.email')->get() as $row) {
            DB::table('contract_signers')->where('id', $row->id)->update([
                'name' => trim("{$row->first_name} {$row->last_name}"),
                'email' => (string) $row->email,
            ]);
        }

        Schema::table('contract_signers', function (Blueprint $table) {
            $table->dropForeign(['person_id']);
        });

        Schema::table('contract_signers', function (Blueprint $table) {
            $table->uuid('person_id')->nullable()->change();
            $table->foreign('person_id')->references('id')->on('people')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('contract_signers', function (Blueprint $table) {
            $table->dropForeign(['person_id']);
            $table->dropColumn(['name', 'email']);
        });

        Schema::table('contract_signers', function (Blueprint $table) {
            $table->foreign('person_id')->references('id')->on('people')->restrictOnDelete();
        });

        Schema::table('field_definitions', function (Blueprint $table) {
            $table->renameColumn('applicant_attribute', 'person_attribute');
        });

        Schema::table('adoptions', function (Blueprint $table) {
            $table->dropForeign(['applicant_person_id']);
            $table->renameColumn('applicant_person_id', 'applicant_id');
            $table->dropIndex(['applicant_email']);
            $table->dropColumn(array_map(fn (string $part) => "applicant_{$part}", [...self::PARTS, 'date_of_birth']));
        });

        Schema::table('adoptions', function (Blueprint $table) {
            $table->foreign('applicant_id')->references('id')->on('people')->cascadeOnDelete();
        });
    }
};
