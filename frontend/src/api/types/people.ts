// Mirrors: api/app/Http/Resources/PersonBaseResource.php
//          api/app/Http/Resources/PersonListResource.php
//          api/app/Http/Resources/PersonDetailResource.php

import type { AnimalTypeResource } from './animal-types'
import type { OrganizationResource } from './organizations'

export interface PersonPicture {
  id: string
  sort_order: number
  type: 'image'
  url: string
  full: string
}

// Scalar fields always present in PersonBaseResource.
// Use this when a Person is nested inside another resource without sub-relations
// (e.g. inspector in AdoptionBaseResource).
export interface PersonBaseResource {
  id: string
  first_name: string
  last_name: string
  full_name: string
  organization_id: string | null
  organization_role: string
  email: string
  date_of_birth: string | null
  street_line: string
  street_line_additional: string
  postal_code: string
  city: string
  country_code: string
  phone: string
  mobile: string
  created_at: string
  updated_at: string
  roles: string[]
}

// Relations loaded in both list and detail person endpoints.
interface PersonWithRelations extends PersonBaseResource {
  organization: OrganizationResource | null
  inspector_animal_types: AnimalTypeResource[]
  mediator_animal_types: AnimalTypeResource[]
  foster_animal_types: AnimalTypeResource[]
}

// Returned by GET /persons (index).
// Relations loaded: organization, *AnimalTypes, media.
export interface PersonListResource extends PersonWithRelations {
  profile_picture_url: string | null
}

// Returned by GET /persons/:id (show), POST /persons (store), PUT /persons/:id (update).
// Relations loaded: organization, *AnimalTypes, media.
export interface PersonDetailResource extends PersonWithRelations {
  pictures: PersonPicture[]
}
