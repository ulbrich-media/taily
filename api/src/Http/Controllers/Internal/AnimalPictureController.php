<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Taily\Models\Animal;
use Taily\Support\UploadLimits;

class AnimalPictureController extends PictureController
{
    public function store(Request $request, Animal $animal): JsonResponse
    {
        $file = $request->file('file');
        // Only sniff the MIME type of a valid upload; a PHP-rejected upload has an
        // empty path and getMimeType() would throw. Validation yields a 422 instead.
        $isVideo = $file instanceof UploadedFile
            && $file->isValid()
            && str_starts_with($file->getMimeType() ?? '', 'video/');

        $request->validate([
            'file' => array_merge(
                ['required', 'file'],
                $isVideo
                    ? ['mimes:mp4,webm,mov', 'max:'.UploadLimits::VIDEO_KB]
                    : ['image', 'mimes:jpg,jpeg,png,webp,gif', 'max:'.UploadLimits::IMAGE_KB]
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
