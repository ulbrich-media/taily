<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'name' => $this->resource->name,
            'email' => $this->resource->email,
            'role' => $this->resource->role,
            'last_login_at' => $this->resource->last_login_at,
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
            'invitation' => $this->whenLoaded('invitation', fn ($v) => $v ? new UserInvitationResource($v) : null),
        ];
    }
}
