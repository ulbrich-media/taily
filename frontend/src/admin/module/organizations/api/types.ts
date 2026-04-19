// ---------------------------------------------------------------------------
// Request / input types (sent to the API — not resource shapes)
// ---------------------------------------------------------------------------

export interface CreateOrganizationRequest {
  name: string
  email?: string
  street_line?: string
  street_line_additional?: string
  postal_code?: string
  city?: string
  country_code?: string
  phone?: string
  mobile?: string
}

export interface UpdateOrganizationRequest {
  name?: string
  email?: string | null
  street_line?: string | null
  street_line_additional?: string | null
  postal_code?: string | null
  city?: string | null
  country_code?: string | null
  phone?: string | null
  mobile?: string | null
}
