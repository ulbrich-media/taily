<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Taily\Http\Controllers\Controller;

abstract class PictureController extends Controller
{
    protected function storeAction(Request $request, Model&HasMedia $parent): JsonResponse
    {
        $request->validate([
            'file' => 'required|image|mimes:jpg,jpeg,png,webp,gif|max:10240',
        ]);

        $file = $request->file('file');

        $media = $parent->addMedia($file)->toMediaCollection('pictures');

        return response()->json([
            'message' => 'Bild erfolgreich hochgeladen.',
            'data' => $this->formatMedia($media),
        ], 201);
    }

    protected function destroyAction(Model&HasMedia $parent, string $pictureUuid): JsonResponse
    {
        $media = $parent->getMedia('pictures')->firstWhere('uuid', $pictureUuid);

        if (! $media) {
            abort(404);
        }

        $media->delete();

        return response()->json([
            'message' => 'Bild erfolgreich gelöscht.',
        ]);
    }

    protected function reorderAction(Request $request, Model&HasMedia $parent): JsonResponse
    {
        $existingUuids = $parent->getMedia('pictures')->pluck('uuid')->all();

        $request->validate([
            'ids' => ['required', 'array', 'size:'.count($existingUuids)],
            'ids.*' => ['string', Rule::in($existingUuids)],
        ]);

        foreach ($request->input('ids') as $index => $uuid) {
            $parent->getMedia('pictures')
                ->firstWhere('uuid', $uuid)
                ?->update(['order_column' => $index]);
        }

        return response()->json([
            'message' => 'Reihenfolge erfolgreich gespeichert.',
        ]);
    }

    protected function formatMedia(Media $media): array
    {
        return [
            'id' => $media->uuid,
            'sort_order' => $media->order_column,
            'url' => $media->getTemporaryUrl(now()->addHour(), 'preview'),
            'full' => $media->getTemporaryUrl(now()->addHour(), 'full'),
            'original' => $media->getTemporaryUrl(now()->addHour()),
        ];
    }
}
