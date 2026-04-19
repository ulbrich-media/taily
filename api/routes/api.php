<?php

use Illuminate\Support\Facades\Route;
use Taily\Http\Controllers\Api\AnimalController;
use Taily\Http\Controllers\Api\AnimalTypeController;

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

Route::middleware(['auth:sanctum', 'ability:animals:read:adoptable'])->group(function () {
    Route::get('/animals', [AnimalController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'ability:animals:read:types'])->group(function () {
    Route::get('/animal-types', [AnimalTypeController::class, 'index']);
});
