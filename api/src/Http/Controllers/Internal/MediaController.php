<?php

namespace Taily\Http\Controllers\Internal;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Taily\Http\Controllers\Controller;

class MediaController extends Controller
{
    public function serve(Request $request, string $mediaUuid): StreamedResponse
    {
        if (! $request->hasValidSignature()) {
            abort(403);
        }

        $media = Media::where('uuid', $mediaUuid)->firstOrFail();

        $conversion = $request->query('conversion', '');

        // getPathRelativeToRoot() returns a disk-relative path suitable for Storage::disk()->response()
        $path = $media->getPathRelativeToRoot($conversion);

        return Storage::disk($media->disk)->response($path);
    }
}
