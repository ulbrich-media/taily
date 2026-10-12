<?php

use Illuminate\Support\Facades\Route;
use Taily\Http\Controllers\Dev\ContractPreviewController;

/*
|--------------------------------------------------------------------------
| Development Routes
|--------------------------------------------------------------------------
|
| Unauthenticated tooling for local development. This file is only ever
| registered in the local and testing environments — see
| TailyServiceProvider::registerRoutes(). Nothing here may be relied on by
| the frontend or the public API.
|
*/

Route::get('/contracts/preview', ContractPreviewController::class)->name('dev.contracts.preview');
