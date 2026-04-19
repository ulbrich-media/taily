// Mirrors: api/app/Http/Controllers/Internal/ApiTokenController.php
// API tokens use Laravel Sanctum — no dedicated Resource class, shape is defined inline.

export interface ApiTokenResource {
  id: string
  name: string
  abilities: string[]
  last_used_at: string | null
  created_at: string
}

// Only returned on token creation (includes the plaintext token).
export interface ApiTokenWithPlainText extends ApiTokenResource {
  token: string
}
