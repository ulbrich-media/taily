<?php

namespace Taily\Http\Controllers\Api;

use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\Api\PublicAnimalTypeResource;
use Taily\Models\AnimalType;

class AnimalTypeController extends Controller
{
    /**
     * Display a listing of all animal types for public API access.
     */
    public function index(): AnonymousResourceCollection
    {
        return PublicAnimalTypeResource::collection(AnimalType::orderBy('title')->with(['vaccinations', 'medicalTests'])->get());
    }
}
