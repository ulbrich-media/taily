// Mirrors: api/app/Http/Resources/HealthConditionResource.php
//          api/app/Http/Resources/HealthConditionVaccinationResource.php
//          api/app/Http/Resources/HealthConditionTestResource.php

import type { AnimalTypeResource } from './animal-types'

// Returned by GET /health-conditions and related endpoints.
export interface HealthConditionResource {
  id: string
  name: string
  animal_type_id: string
  created_at: string
  updated_at: string
  animal_type: AnimalTypeResource
}

// Used inside Animal.health_condition_vaccinations — includes pivot data.
export interface HealthConditionVaccinationResource {
  id: string
  name: string
  animal_type_id: string
  created_at: string
  updated_at: string
  pivot: {
    animal_id: string
    health_condition_id: string
    vaccinated_at: string
    created_at: string
    updated_at: string
  }
}

// Used inside Animal.health_condition_tests — includes pivot data.
export interface HealthConditionTestResource {
  id: string
  name: string
  animal_type_id: string
  created_at: string
  updated_at: string
  pivot: {
    animal_id: string
    health_condition_id: string
    tested_at: string
    result: 'positive' | 'negative'
    created_at: string
    updated_at: string
  }
}
