<?php

namespace Taily\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Security posture stays between admins: telling every user which
        // accounts lack a second factor (or sit unused) would hand a
        // compromised regular account a ready-made target list.
        $requesterIsAdmin = (bool) $request->user()?->isAdmin();

        return [
            'id' => $this->resource->id,
            'name' => $this->resource->name,
            'email' => $this->resource->email,
            'role' => $this->resource->role,
            // Confirmed second factor only. A generated-but-unconfirmed secret
            // does not gate login, so it counts as "not enabled" — matching the
            // signal ProfileController exposes for the authenticated user.
            'two_factor_enabled' => $this->when($requesterIsAdmin, fn () => ! is_null($this->resource->two_factor_confirmed_at)),
            'last_login_at' => $this->when($requesterIsAdmin, $this->resource->last_login_at),
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
            'invitation' => $this->whenLoaded('invitation', fn ($v) => $v ? new UserInvitationResource($v) : null),
        ];
    }
}
