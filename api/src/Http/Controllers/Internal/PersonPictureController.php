<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Models\Person;

class PersonPictureController extends PictureController
{
    public function store(Request $request, Person $person): JsonResponse
    {
        return $this->storeAction($request, $person);
    }

    public function destroy(Person $person, string $picture): JsonResponse
    {
        return $this->destroyAction($person, $picture);
    }

    public function reorder(Request $request, Person $person): JsonResponse
    {
        return $this->reorderAction($request, $person);
    }
}
