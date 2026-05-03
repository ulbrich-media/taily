<?php

namespace Taily\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class PublicAnimalResource extends JsonResource
{
    private function formatMedia(Media $media): array
    {
        $isVideo = str_starts_with($media->mime_type ?? '', 'video/');

        return [
            'id' => $media->uuid,
            'type' => $isVideo ? 'video' : 'image',
            'thumbnail' => $isVideo ? null : route('api.media.serve', ['mediaUuid' => $media->uuid, 'conversion' => 'thumbnail']),
            'url' => route('api.media.serve', array_filter(['mediaUuid' => $media->uuid, 'conversion' => $isVideo ? null : 'preview'])),
            'full' => route('api.media.serve', array_filter(['mediaUuid' => $media->uuid, 'conversion' => $isVideo ? null : 'full'])),
        ];
    }

    public function toArray(Request $request): array
    {
        // All data possibly relevant during public display of an animal.
        // No personal information is returned here.
        return [
            'id' => $this->resource->id,
            'animal_type_id' => $this->resource->animal_type_id,
            'animal_number' => $this->resource->animal_number,
            'name' => $this->resource->name,
            'old_name' => $this->resource->old_name,
            'breed' => $this->resource->breed,
            'gender' => $this->resource->gender,
            'color' => $this->resource->color,
            'weight_grams' => $this->resource->weight_grams,
            'size_cm' => $this->resource->size_cm,
            'date_of_birth' => $this->resource->date_of_birth,
            'origin_country' => $this->resource->origin_country,
            'intake_date' => $this->resource->intake_date,
            'character_description' => $this->resource->character_description,
            'contract_notes' => $this->resource->contract_notes,
            'is_neutered' => $this->resource->is_neutered,
            'health_description' => $this->resource->health_description,
            'adoption_fee' => $this->resource->adoption_fee,
            'current_location' => $this->resource->current_location,
            'do_publish' => $this->resource->do_publish,
            'publish_description' => $this->resource->publish_description,
            'application_url' => $this->resource->application_url,
            'compatibilities' => $this->whenLoaded('compatibilities', fn () => $this->resource->compatibilities->pluck('value')->values()->all(), []
            ),
            'personality_traits' => $this->whenLoaded('personalityTraits', fn () => $this->resource->personalityTraits->pluck('value')->values()->all(), []
            ),
            // Metadata
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
            // Relations (only included when eager-loaded)
            'vaccinations' => PublicAnimalVaccinationResource::collection($this->whenLoaded('vaccinations')),
            'medical_tests' => PublicMedicalTestResource::collection($this->whenLoaded('medicalTests')),
            'media' => $this->resource->getMedia('pictures')
                ->sortBy('order_column')
                ->values()
                ->map(fn (Media $media) => $this->resource->formatMedia($media)),
        ];
    }
}
