// Mirrors: api/app/Http/Resources/OrganizationResource.php
// Note: string fields use empty string as the "no value" state (see empty-strings pattern).

export interface OrganizationResource {
  id: string
  name: string
  email: string
  street_line: string
  street_line_additional: string
  postal_code: string
  city: string
  country_code: string
  phone: string
  mobile: string
  people_count: number | null
  created_at: string
  updated_at: string
}
