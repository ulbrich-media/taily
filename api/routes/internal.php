<?php

use Illuminate\Support\Facades\Route;
use Taily\Http\Controllers\Internal\AdoptionController;
use Taily\Http\Controllers\Internal\AnimalController;
use Taily\Http\Controllers\Internal\AnimalPictureController;
use Taily\Http\Controllers\Internal\AnimalTypeController;
use Taily\Http\Controllers\Internal\ApiTokenController;
use Taily\Http\Controllers\Internal\Auth\AuthenticatedSessionController;
use Taily\Http\Controllers\Internal\FormTemplateController;
use Taily\Http\Controllers\Internal\HealthConditionController;
use Taily\Http\Controllers\Internal\InvitationController;
use Taily\Http\Controllers\Internal\MediaController;
use Taily\Http\Controllers\Internal\OrganizationController;
use Taily\Http\Controllers\Internal\PersonController;
use Taily\Http\Controllers\Internal\PersonPictureController;
use Taily\Http\Controllers\Internal\PreInspectionController;
use Taily\Http\Controllers\Internal\PreInspectionSubmissionController;
use Taily\Http\Controllers\Internal\ProfileController;
use Taily\Http\Controllers\Internal\UserController;

/*
|--------------------------------------------------------------------------
| Internal API Routes
|--------------------------------------------------------------------------
|
| These routes are for the internal React application. They require
| authentication via Laravel Sanctum and provide full CRUD access to
| all resources.
|
*/

// Media serve route (signed URL is the auth mechanism)
Route::get('/media/{mediaUuid}', [MediaController::class, 'serve'])->name('media.serve');

// Authentication routes
Route::post('/login', [AuthenticatedSessionController::class, 'store']);

// Public invitation routes
Route::get('/invitations/{token}', [InvitationController::class, 'show']);
Route::post('/invitations/{token}/accept', [InvitationController::class, 'accept']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
    // Current user
    Route::get('/user', [UserController::class, 'current']);

    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);

    // Users administration
    Route::apiResource('users', UserController::class);

    // Animals
    Route::apiResource('animals', AnimalController::class);
    Route::post('/animals/{animal}/pictures', [AnimalPictureController::class, 'store']);
    Route::put('/animals/{animal}/pictures/reorder', [AnimalPictureController::class, 'reorder']);
    Route::delete('/animals/{animal}/pictures/{picture}', [AnimalPictureController::class, 'destroy']);

    // Animal Types
    Route::apiResource('animal-types', AnimalTypeController::class);

    // Health Items
    Route::apiResource('health-conditions', HealthConditionController::class);

    // People
    Route::apiResource('persons', PersonController::class);
    Route::post('/persons/{person}/pictures', [PersonPictureController::class, 'store']);
    Route::put('/persons/{person}/pictures/reorder', [PersonPictureController::class, 'reorder']);
    Route::delete('/persons/{person}/pictures/{picture}', [PersonPictureController::class, 'destroy']);

    // Organizations
    Route::apiResource('organizations', OrganizationController::class);

    // Adoptions
    Route::get('/adoptions/options', [AdoptionController::class, 'options']);
    Route::apiResource('adoptions', AdoptionController::class);

    // API Tokens
    Route::get('/api-tokens/abilities', [ApiTokenController::class, 'abilities']);
    Route::get('/api-tokens', [ApiTokenController::class, 'index']);
    Route::post('/api-tokens', [ApiTokenController::class, 'store']);
    Route::delete('/api-tokens/{tokenId}', [ApiTokenController::class, 'destroy']);

    // Form Templates
    Route::get('/form-templates', [FormTemplateController::class, 'index']);
    Route::post('/form-templates', [FormTemplateController::class, 'store']);
    Route::get('/form-templates/{type}/versions', [FormTemplateController::class, 'versions']);
    Route::get('/form-templates/{formTemplate}', [FormTemplateController::class, 'show']);
    Route::put('/form-templates/{formTemplate}', [FormTemplateController::class, 'update']);
    Route::post('/form-templates/{formTemplate}/validate', [FormTemplateController::class, 'validateData']);

    // Pre-Inspections
    Route::apiResource('pre-inspections', PreInspectionController::class);
});

// Public pre-inspection submission routes (token-protected, no auth required)
Route::get('/inspect/{token}', [PreInspectionSubmissionController::class, 'show']);
Route::post('/inspect/{token}/submit', [PreInspectionSubmissionController::class, 'submit']);
