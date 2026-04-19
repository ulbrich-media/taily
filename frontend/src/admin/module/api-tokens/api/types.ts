// ---------------------------------------------------------------------------
// Other types (not resource shapes)
// ---------------------------------------------------------------------------

export interface ApiAbility {
  [key: string]: string
}

// ---------------------------------------------------------------------------
// Response types (returned by the API)
// ---------------------------------------------------------------------------

import type {
  ApiTokenResource,
  ApiTokenWithPlainText,
} from '@/api/types/api-tokens'

export interface ApiTokensResponse {
  data: ApiTokenResource[]
  available_abilities: ApiAbility
}
export interface ApiAbilitiesResponse {
  data: ApiAbility
}
export interface CreateApiTokenResponse {
  message: string
  data: ApiTokenWithPlainText
}
export interface DeleteApiTokenResponse {
  message: string
}

// ---------------------------------------------------------------------------
// Request / input types (sent to the API — not resource shapes)
// ---------------------------------------------------------------------------

export interface CreateApiTokenRequest {
  name: string
  abilities: string[]
}
