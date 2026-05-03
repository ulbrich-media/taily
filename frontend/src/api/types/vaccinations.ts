// Mirrors: api/app/Http/Resources/VaccinationResource.php
//          api/app/Http/Resources/AnimalVaccinationResource.php

import type { AnimalTypeResource } from './animal-types'

// Returned by GET /vaccinations and related endpoints.
export interface VaccinationResource {
  id: string
  title: string
  description: string
  animal_type_id: string
  created_at: string
  updated_at: string
  animal_type: AnimalTypeResource
}

// Used inside Animal.vaccinations — includes pivot data.
export interface AnimalVaccinationResource {
  id: string
  title: string
  description: string
  animal_type_id: string
  created_at: string
  updated_at: string
  pivot: {
    animal_id: string
    vaccination_id: string
    vaccinated_at: string | null
    created_at: string
    updated_at: string
  }
}
