<?php

namespace Taily\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Taily\Http\Controllers\Controller;
use Taily\Http\Requests\UpdateWebsiteUrlRequest;
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

    /**
     * Store (or clear) the URL under which the website shows a published animal.
     */
    public function updateWebsiteUrl(UpdateWebsiteUrlRequest $request, Animal $animal): PublicAnimalResource
    {
        abort_unless($animal->do_publish, 404);

        $animal->update(['website_url' => $request->validated('website_url')]);

        return new PublicAnimalResource($animal);
    }
}
