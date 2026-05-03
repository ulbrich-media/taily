<?php

use Illuminate\Support\Facades\Route;
use Taily\Http\Controllers\Api\AnimalController;
use Taily\Http\Controllers\Api\AnimalTypeController;
use Taily\Http\Controllers\Api\PublicMediaController;

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register public API routes for your application.
| These routes are intended for external consumers and require API
| token authentication with appropriate scopes.
|
*/

// Unauthenticated — suitable for direct use in <img src> and <video src>.
// Access is gated on the animal's do_publish flag inside the controller.
Route::get('/media/{mediaUuid}', [PublicMediaController::class, 'serve'])
    ->name('api.media.serve');

Route::middleware(['auth:sanctum', 'ability:animals:read:adoptable'])->group(function () {
    Route::get('/animals', [AnimalController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'ability:animals:read:types'])->group(function () {
    Route::get('/animal-types', [AnimalTypeController::class, 'index']);
});
