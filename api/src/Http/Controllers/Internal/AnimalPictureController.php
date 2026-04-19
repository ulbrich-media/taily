<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Models\Animal;

class AnimalPictureController extends PictureController
{
    public function store(Request $request, Animal $animal): JsonResponse
    {
        return $this->storeAction($request, $animal);
    }

    public function destroy(Animal $animal, string $picture): JsonResponse
    {
        return $this->destroyAction($animal, $picture);
    }

    public function reorder(Request $request, Animal $animal): JsonResponse
    {
        return $this->reorderAction($request, $animal);
    }
}
