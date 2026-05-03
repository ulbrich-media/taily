<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Taily\Http\Controllers\Controller;

class MediaController extends Controller
{
    public function serve(Request $request, string $mediaUuid): BinaryFileResponse
    {
        if (! $request->hasValidSignature()) {
            abort(403);
        }

        $media = Media::where('uuid', $mediaUuid)->firstOrFail();

        $conversion = $request->query('conversion', '');

        $path = $media->getPathRelativeToRoot($conversion);

        // Conversions may be stored on a different disk than the original file.
        $disk = $conversion ? ($media->conversions_disk ?? $media->disk) : $media->disk;

        // BinaryFileResponse (unlike StreamedResponse) sets Accept-Ranges and handles
        // Range requests, which Safari requires for video playback.
        // Let BinaryFileResponse infer Content-Type from the file rather than using
        // $media->mime_type, which reflects the original file and not the conversion format.
        $absolutePath = Storage::disk($disk)->path($path);

        return response()->file($absolutePath);
    }
}
