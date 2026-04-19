// ---------------------------------------------------------------------------
// Response types (returned by the API)
// ---------------------------------------------------------------------------

import type {
  PersonListResource,
  PersonDetailResource,
  PersonPicture,
} from '@/api/types/people'

/** Single person (detail response shape). */
export type Person = PersonDetailResource
export type PeopleResponse = PersonListResource[]
export interface PersonResponse {
  message: string
  data: PersonDetailResource
}
export interface DeletePersonResponse {
  message: string
}
export interface UploadPersonPictureResponse {
  message: string
  data: PersonPicture
}

// ---------------------------------------------------------------------------
// Request / input types (sent to the API — not resource shapes)
// ---------------------------------------------------------------------------

export interface CreatePersonRequest {
  first_name: string
  last_name: string
  organization_id?: string | null
  organization_role?: string
  email?: string
  street_line?: string
  street_line_additional?: string
  postal_code?: string
  city?: string
  country_code?: string
  phone?: string
  mobile?: string
  date_of_birth?: string | null
}

export interface UpdatePersonRequest {
  first_name?: string
  last_name?: string
  organization_id?: string | null
  organization_role?: string
  email?: string
  street_line?: string
  street_line_additional?: string
  postal_code?: string
  city?: string
  country_code?: string
  phone?: string
  mobile?: string
  date_of_birth?: string | null
  inspector_animal_type_ids?: string[]
  mediator_animal_type_ids?: string[]
  foster_animal_type_ids?: string[]
}
