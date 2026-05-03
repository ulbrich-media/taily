<?php

namespace Taily\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Taily\Http\Controllers\Controller;
use Taily\Http\Resources\Api\PublicAnimalResource;
use Taily\Models\Animal;

class AnimalController extends Controller
{
    /**
     * Display a listing of adoptable animals for public API access.
     *
     * Accepts an optional `animal_type_id` query parameter to filter by type.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Animal::where('do_publish', true)
            ->orderBy('intake_date', 'desc');

        if ($request->filled('animal_type_id')) {
            $query->where('animal_type_id', $request->input('animal_type_id'));
        }

        $query->with(['vaccinations', 'medicalTests', 'compatibilities', 'personalityTraits', 'media']);

        return PublicAnimalResource::collection($query->get());
    }
}
