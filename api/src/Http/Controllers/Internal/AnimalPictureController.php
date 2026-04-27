<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Taily\Models\Animal;

class AnimalPictureController extends PictureController
{
    public function store(Request $request, Animal $animal): JsonResponse
    {
        $file = $request->file('file');
        $isVideo = $file && str_starts_with($file->getMimeType() ?? '', 'video/');

        $request->validate([
            'file' => array_merge(
                ['required', 'file'],
                $isVideo
                    ? ['mimes:mp4,webm,mov', 'max:102400']
                    : ['image', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240']
            ),
        ]);

        $media = $animal->addMedia($request->file('file'))->toMediaCollection('pictures');

        return response()->json([
            'message' => $isVideo ? 'Video erfolgreich hochgeladen.' : 'Bild erfolgreich hochgeladen.',
            'data' => $this->formatMedia($media),
        ], 201);
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
