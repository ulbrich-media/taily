<?php

namespace Taily\Support;

use DateTimeInterface;
use Illuminate\Support\Facades\URL;
use Spatie\MediaLibrary\Support\UrlGenerator\BaseUrlGenerator;

class MediaUrlGenerator extends BaseUrlGenerator
{
    public function getUrl(): string
    {
        // All files are private — direct public URLs are not supported
        return '';
    }

    public function getTemporaryUrl(DateTimeInterface $expiration, array $options = []): string
    {
        $params = ['mediaUuid' => $this->media->uuid];

        if ($this->conversion !== null && $this->conversion->getName() !== '') {
            $params['conversion'] = $this->conversion->getName();
        }

        return URL::temporarySignedRoute('media.serve', $expiration, $params);
    }

    public function getPath(): string
    {
        return $this->getDisk()->path($this->getPathRelativeToRoot());
    }

    public function getResponsiveImagesDirectoryUrl(): string
    {
        return '';
    }
}
