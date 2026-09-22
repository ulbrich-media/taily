<?php

namespace Database\Seeders\Support;

use Spatie\MediaLibrary\HasMedia;

/**
 * Hands out the images in seeder-assets/, up to a limit.
 *
 * Attaching media is by far the most expensive thing the seeder does — the
 * conversions run inline — so the number of records that get a picture is
 * capped rather than tied to the number of records generated. Files are
 * reused in turn once the set has been handed out, so a larger data set still
 * shows pictures throughout.
 */
class SeedImages
{
    /** @var list<string> */
    private array $files;

    private int $handedOut = 0;

    public function __construct(string $directory, private readonly ?int $limit = null)
    {
        $files = glob(base_path('seeder-assets/'.$directory.'/*.jpg')) ?: [];
        shuffle($files);

        $this->files = array_values($files);
    }

    /**
     * Attaches one picture to the model, unless the limit is exhausted.
     */
    public function attachTo(HasMedia $model, string $collection = 'pictures'): void
    {
        $file = $this->next();

        if ($file === null) {
            return;
        }

        $model->addMedia($file)
            ->preservingOriginal()
            ->toMediaCollection($collection);
    }

    private function next(): ?string
    {
        if ($this->files === []) {
            return null;
        }

        $limit = $this->limit ?? count($this->files);

        if ($this->handedOut >= $limit) {
            return null;
        }

        return $this->files[$this->handedOut++ % count($this->files)];
    }
}
