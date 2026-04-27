// Mirrors: api/app/Http/Resources/MedicalTestResource.php
//          api/app/Http/Resources/AnimalMedicalTestResource.php

import type { AnimalTypeResource } from './animal-types'

// Returned by GET /medical-tests and related endpoints.
export interface MedicalTestResource {
  id: string
  title: string
  description: string
  animal_type_id: string
  created_at: string
  updated_at: string
  animal_type: AnimalTypeResource
}

// Used inside Animal.medical_tests — includes pivot data.
export interface AnimalMedicalTestResource {
  id: string
  title: string
  description: string
  animal_type_id: string
  created_at: string
  updated_at: string
  pivot: {
    animal_id: string
    medical_test_id: string
    tested_at: string | null
    result: 'positive' | 'negative'
    created_at: string
    updated_at: string
  }
}
