<?php

namespace Taily\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Taily\Http\Controllers\Controller;
use Taily\Models\Animal;

class PublicMediaController extends Controller
{
    public function serve(Request $request, string $mediaUuid): BinaryFileResponse
    {
        $media = Media::where('uuid', $mediaUuid)->firstOrFail();

        // Only Animal media is publicly accessible. Person media and any other
        // model's media must never be served here — return 404 for both cases
        // to avoid leaking that a UUID exists on a non-animal model.
        if ($media->model_type !== Animal::class || ! $media->model?->do_publish) {
            abort(404);
        }

        $conversion = $request->query('conversion', '');

        if ($conversion && ! $media->hasGeneratedConversion($conversion)) {
            abort(404);
        }

        // Conversions may be stored on a different disk than the original file.
        $disk = $conversion ? ($media->conversions_disk ?? $media->disk) : $media->disk;
        $absolutePath = Storage::disk($disk)->path($media->getPathRelativeToRoot($conversion));

        // Cache for one week. Safe because each upload gets a new UUID, so the
        // content at a given URL is immutable. One week (vs. one year) limits
        // the window where a browser or CDN might still serve media after the
        // animal is unpublished.
        return response()->file($absolutePath, ['Cache-Control' => 'public, max-age=604800']);
    }
}
