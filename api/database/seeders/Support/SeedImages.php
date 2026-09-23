<?php

namespace Database\Seeders\Support;

use Spatie\MediaLibrary\HasMedia;

/**
 * Hands out the images in seeder-assets/ to a share of the records.
 *
 * Not everything has a picture in practice — a shelter photographs nearly
 * every animal it lists, but a new arrival can sit there without one for a
 * while, and most people in the directory are just contact details. The share
 * says how likely a record is to get one, so coverage is a decision rather
 * than a side effect of how many files happen to sit in the folder.
 *
 * Files are handed out in a shuffled order and the order is reshuffled each
 * time the set runs out, so every picture is used before any is used twice.
 *
 * Attaching media is by far the most expensive thing the seeder does, since
 * the conversions run inline — a large data set turns the share down to zero.
 */
class SeedImages
{
    /** @var list<string> */
    private array $files = [];

    /** @var list<string> */
    private array $remaining = [];

    /**
     * @param  int  $sharePercent  how many records out of a hundred get a picture
     */
    public function __construct(string $directory, private readonly int $sharePercent = 100)
    {
        $this->files = array_values(glob(base_path('seeder-assets/'.$directory.'/*.jpg')) ?: []);
    }

    /**
     * The picture the next record gets, or null when it is one of those
     * without one.
     *
     * The draw comes from mt_rand like everything else in the seeder, so
     * `app:seed --seed=` still reproduces which records ended up with a
     * picture and which file each of them got.
     */
    public function pick(): ?string
    {
        if ($this->files === [] || ! $this->isPictured()) {
            return null;
        }

        if ($this->remaining === []) {
            $this->remaining = $this->files;
            shuffle($this->remaining);
        }

        return array_pop($this->remaining);
    }

    /**
     * Gives the model a picture, if this one is among the share that gets one.
     */
    public function attachTo(HasMedia $model, string $collection = 'pictures'): void
    {
        $file = $this->pick();

        if ($file === null) {
            return;
        }

        $model->addMedia($file)
            ->preservingOriginal()
            ->toMediaCollection($collection);
    }

    private function isPictured(): bool
    {
        if ($this->sharePercent >= 100) {
            return true;
        }

        return $this->sharePercent > 0 && mt_rand(1, 100) <= $this->sharePercent;
    }
}
