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

        // getPathRelativeToRoot() returns a disk-relative path suitable for Storage::disk()->path()
        $path = $media->getPathRelativeToRoot($conversion);

        // BinaryFileResponse (unlike StreamedResponse) sets Accept-Ranges and handles
        // Range requests, which Safari requires for video playback.
        $absolutePath = Storage::disk($media->disk)->path($path);

        return response()->file($absolutePath, ['Content-Type' => $media->mime_type]);
    }
}
