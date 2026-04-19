// Mirrors: api/app/Http/Resources/AnimalBaseResource.php
//          api/app/Http/Resources/AnimalListResource.php
//          api/app/Http/Resources/AnimalDetailResource.php

import type { AnimalTypeResource } from './animal-types'
import type { PersonBaseResource } from './people'
import type {
  HealthConditionVaccinationResource,
  HealthConditionTestResource,
} from './health-conditions'
import type { AdoptionBaseResource } from './adoptions'

export interface AnimalPicture {
  id: string
  sort_order: number
  url: string // preview 800px
  full: string // 1440px
}

// Scalar fields shared by list and detail resources.
// Use this when an Animal is nested inside another resource (e.g. AdoptionBaseResource).
// For endpoint responses use AnimalListResource or AnimalDetailResource.
export interface AnimalBaseResource {
  id: string
  // Tab 1: Basic & Description
  animal_type_id: string
  animal_number: string
  name: string
  old_name: string | null
  breed: string | null
  gender: 'male' | 'female'
  color: string | null
  date_of_birth: string | null
  origin_country: string | null
  is_boarding_animal: boolean
  intake_date: string | null
  character_description: string | null
  contract_notes: string | null
  internal_notes: string | null
  // Tab 2: Health & Identification
  is_neutered: boolean
  health_description: string | null
  tasso_id: string | null
  findefix_id: string | null
  trace_id: string | null
  // Tab 3: Placement, Contract & Costs
  assigned_agent_id: string | null
  origin_organization: string | null
  owner_id: string | null
  adoption_fee: string | null
  monthly_boarding_cost: string | null
  monthly_sponsorship: string | null
  sponsor_id: string | null
  sponsor_external: string | null
  // Tab 4: Organization, Marketing & Status
  current_location: string | null
  alternate_transport_trace: string | null
  alternate_arrival_location: string | null
  do_publish: boolean
  is_deceased: boolean
  date_of_death: string | null
  // Metadata
  created_at: string
  updated_at: string
}

// Returned by GET /animals (index).
// Relations loaded: animalType, media.
export interface AnimalListResource extends AnimalBaseResource {
  animal_type: AnimalTypeResource
  profile_picture_url: string | null
}

// Returned by GET /animals/:id (show), POST /animals (store), PUT /animals/:id (update).
// All relations are loaded.
export interface AnimalDetailResource extends AnimalBaseResource {
  animal_type: AnimalTypeResource
  assigned_agent: PersonBaseResource | null
  owner: PersonBaseResource | null
  sponsor: PersonBaseResource | null
  adoptions: AdoptionBaseResource[]
  health_condition_vaccinations: HealthConditionVaccinationResource[]
  health_condition_tests: HealthConditionTestResource[]
  pictures: AnimalPicture[]
}
