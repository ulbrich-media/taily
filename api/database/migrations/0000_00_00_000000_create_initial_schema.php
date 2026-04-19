<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Consolidated initial schema representing the first state of all tables.
     */
    public function up(): void
    {
        // ----------------------------------------------------------------
        // users
        // ----------------------------------------------------------------
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->enum('role', ['user', 'admin'])->default('user');
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();
        });

        // ----------------------------------------------------------------
        // password_reset_tokens
        // ----------------------------------------------------------------
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // ----------------------------------------------------------------
        // sessions
        // ----------------------------------------------------------------
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignUuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // ----------------------------------------------------------------
        // cache
        // ----------------------------------------------------------------
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });

        // ----------------------------------------------------------------
        // jobs / job_batches / failed_jobs
        // ----------------------------------------------------------------
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });

        // ----------------------------------------------------------------
        // personal_access_tokens
        // ----------------------------------------------------------------
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuidMorphs('tokenable');
            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });

        // ----------------------------------------------------------------
        // user_invitations
        // ----------------------------------------------------------------
        Schema::create('user_invitations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->onDelete('cascade');
            $table->string('token', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
        });

        // ----------------------------------------------------------------
        // access_tokens
        // ----------------------------------------------------------------
        Schema::create('access_tokens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuidMorphs('tokenable');
            $table->string('token', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamp('created_at');
        });

        // ----------------------------------------------------------------
        // organizations
        // ----------------------------------------------------------------
        Schema::create('organizations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email');
            $table->string('street_line');
            $table->string('street_line_additional');
            $table->string('postal_code');
            $table->string('city');
            $table->string('country_code', 2);
            $table->string('phone');
            $table->string('mobile');
            $table->timestamps();
        });

        // ----------------------------------------------------------------
        // form_templates
        // ----------------------------------------------------------------
        Schema::create('form_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->string('name');
            $table->json('schema');
            $table->json('ui_schema')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();

            $table->unique(['type', 'version']);
        });

        // ----------------------------------------------------------------
        // animal_types
        // ----------------------------------------------------------------
        Schema::create('animal_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->foreignUuid('form_template_id')->nullable()->constrained('form_templates')->onDelete('set null');
            $table->timestamps();
        });

        // ----------------------------------------------------------------
        // people
        // ----------------------------------------------------------------
        Schema::create('people', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('first_name');
            $table->string('last_name');
            $table->foreignUuid('organization_id')->nullable()->constrained()->onDelete('set null');
            $table->string('organization_role');
            $table->string('email');
            $table->string('street_line');
            $table->string('street_line_additional');
            $table->string('postal_code');
            $table->string('city');
            $table->string('country_code', 2);
            $table->string('phone');
            $table->string('mobile');
            $table->date('date_of_birth')->nullable();
            $table->timestamps();
        });

        // ----------------------------------------------------------------
        // animal_type_person_inspector  (pivot)
        // ----------------------------------------------------------------
        Schema::create('animal_type_person_inspector', function (Blueprint $table) {
            $table->uuid('person_id');
            $table->uuid('animal_type_id');
            $table->timestamps();

            $table->foreign('person_id')->references('id')->on('people')->onDelete('cascade');
            $table->foreign('animal_type_id')->references('id')->on('animal_types')->onDelete('cascade');

            $table->primary(['person_id', 'animal_type_id']);
        });

        // ----------------------------------------------------------------
        // animal_type_person_mediator  (pivot)
        // ----------------------------------------------------------------
        Schema::create('animal_type_person_mediator', function (Blueprint $table) {
            $table->uuid('person_id');
            $table->uuid('animal_type_id');
            $table->timestamps();

            $table->foreign('person_id')->references('id')->on('people')->onDelete('cascade');
            $table->foreign('animal_type_id')->references('id')->on('animal_types')->onDelete('cascade');

            $table->primary(['person_id', 'animal_type_id']);
        });

        // ----------------------------------------------------------------
        // animal_type_person_foster  (pivot)
        // ----------------------------------------------------------------
        Schema::create('animal_type_person_foster', function (Blueprint $table) {
            $table->uuid('person_id');
            $table->uuid('animal_type_id');
            $table->timestamps();

            $table->foreign('person_id')->references('id')->on('people')->onDelete('cascade');
            $table->foreign('animal_type_id')->references('id')->on('animal_types')->onDelete('cascade');

            $table->primary(['person_id', 'animal_type_id']);
        });

        // ----------------------------------------------------------------
        // animals
        // ----------------------------------------------------------------
        Schema::create('animals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('animal_number');
            $table->string('name');
            $table->string('old_name');
            $table->string('breed');
            $table->enum('gender', ['male', 'female']);
            $table->string('color');
            $table->string('origin_country');
            $table->boolean('is_boarding_animal')->default(false);
            $table->text('character_description');
            $table->text('contract_notes');
            $table->text('internal_notes');
            $table->date('date_of_birth')->nullable();
            $table->date('intake_date')->nullable();
            $table->boolean('is_neutered')->default(false);
            $table->text('health_description');
            $table->string('tasso_id');
            $table->string('findefix_id');
            $table->string('trace_id');
            $table->foreignUuid('assigned_agent_id')->nullable()->constrained('people')->nullOnDelete();
            $table->string('origin_organization');
            $table->foreignUuid('owner_id')->nullable()->constrained('people')->nullOnDelete();
            $table->decimal('adoption_fee', 10, 2)->nullable();
            $table->decimal('monthly_boarding_cost', 10, 2)->nullable();
            $table->decimal('monthly_sponsorship', 10, 2)->nullable();
            $table->foreignUuid('sponsor_id')->nullable()->constrained('people')->nullOnDelete();
            $table->string('sponsor_external');
            $table->string('current_location');
            $table->string('alternate_transport_trace');
            $table->string('alternate_arrival_location');
            $table->boolean('do_publish')->default(false);
            $table->boolean('is_deceased')->default(false);
            $table->date('date_of_death')->nullable();
            $table->foreignUuid('animal_type_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        // ----------------------------------------------------------------
        // health_conditions
        // ----------------------------------------------------------------
        Schema::create('health_conditions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->foreignUuid('animal_type_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        // ----------------------------------------------------------------
        // animal_health_condition_vaccination  (pivot)
        // ----------------------------------------------------------------
        Schema::create('animal_health_condition_vaccination', function (Blueprint $table) {
            $table->foreignUuid('animal_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('health_condition_id')->constrained()->cascadeOnDelete();
            $table->date('vaccinated_at');
            $table->timestamps();

            $table->primary(['animal_id', 'health_condition_id'], 'animal_health_condition_vaccination_primary');
        });

        // ----------------------------------------------------------------
        // animal_health_condition_test  (pivot)
        // ----------------------------------------------------------------
        Schema::create('animal_health_condition_test', function (Blueprint $table) {
            $table->foreignUuid('animal_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('health_condition_id')->constrained()->cascadeOnDelete();
            $table->date('tested_at');
            $table->enum('result', ['positive', 'negative']);
            $table->timestamps();

            $table->primary(['animal_id', 'health_condition_id'], 'animal_health_condition_test_primary');
        });

        // ----------------------------------------------------------------
        // adoptions
        // ----------------------------------------------------------------
        Schema::create('adoptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('animal_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('mediator_id')->nullable()->constrained('people')->nullOnDelete();
            $table->foreignUuid('applicant_id')->constrained('people')->onDelete('cascade');
            $table->foreignUuid('inspector_id')->nullable()->constrained('people')->onDelete('set null');

            $table->enum('pre_inspection_result', ['not_conducted', 'approved', 'rejected'])->default('not_conducted');
            $table->text('pre_inspection_summary');

            $table->date('contract_sent_at')->nullable();
            $table->boolean('contract_signed')->default(false);

            $table->date('transfer_planned_at')->nullable();
            $table->date('transferred_at')->nullable();

            $table->timestamps();
        });

        // ----------------------------------------------------------------
        // pre_inspections
        // ----------------------------------------------------------------
        Schema::create('pre_inspections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('person_id')->constrained('people')->onDelete('cascade');
            $table->foreignUuid('animal_type_id')->constrained('animal_types')->restrictOnDelete();
            $table->foreignUuid('inspector_id')->nullable()->constrained('people')->onDelete('restrict');
            $table->enum('verdict', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('notes');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });

        // ----------------------------------------------------------------
        // media  (spatie/laravel-medialibrary)
        // ----------------------------------------------------------------
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->uuidMorphs('model');
            $table->uuid()->nullable()->unique();
            $table->string('collection_name');
            $table->string('name');
            $table->string('file_name');
            $table->string('mime_type')->nullable();
            $table->string('disk');
            $table->string('conversions_disk')->nullable();
            $table->unsignedBigInteger('size');
            $table->json('manipulations');
            $table->json('custom_properties');
            $table->json('generated_conversions');
            $table->json('responsive_images');
            $table->unsignedInteger('order_column')->nullable()->index();
            $table->nullableTimestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop in reverse dependency order
        Schema::dropIfExists('media');
        Schema::dropIfExists('pre_inspections');
        Schema::dropIfExists('adoptions');
        Schema::dropIfExists('animal_health_condition_test');
        Schema::dropIfExists('animal_health_condition_vaccination');
        Schema::dropIfExists('health_conditions');
        Schema::dropIfExists('animals');
        Schema::dropIfExists('animal_type_person_foster');
        Schema::dropIfExists('animal_type_person_mediator');
        Schema::dropIfExists('animal_type_person_inspector');
        Schema::dropIfExists('people');
        Schema::dropIfExists('animal_types');
        Schema::dropIfExists('form_templates');
        Schema::dropIfExists('organizations');
        Schema::dropIfExists('access_tokens');
        Schema::dropIfExists('user_invitations');
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
