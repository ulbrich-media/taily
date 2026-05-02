// ---------------------------------------------------------------------------
// Request / input types (sent to the API — not resource shapes)
// ---------------------------------------------------------------------------

export interface VaccinationFormData {
  vaccination_id: string
  vaccinated_at: string | null
}

export interface TestFormData {
  medical_test_id: string
  tested_at: string | null
  result: 'positive' | 'negative'
}

export interface CreateAnimalRequest {
  // Tab 1: Basic & Description
  animal_type_id: string
  animal_number: string
  name: string
  old_name?: string
  breed?: string
  gender: 'male' | 'female'
  color?: string
  weight_grams?: string | null
  size_cm?: string | null
  date_of_birth?: string | null
  origin_country?: string
  intake_date?: string | null
  character_description?: string
  contract_notes?: string
  internal_notes?: string
}

export interface UpdateAnimalRequest extends CreateAnimalRequest {
  // Tab 2: Health & Identification
  is_neutered: boolean
  health_description?: string
  tasso_id?: string
  findefix_id?: string
  trace_id?: string
  vaccinations?: VaccinationFormData[]
  tests?: TestFormData[]
  // Tab 3: Placement, Contract & Costs
  assigned_agent_id?: string | null
  origin_organization?: string
  owner_id?: string | null
  adoption_fee?: string | null
  is_boarding_animal: boolean
  monthly_boarding_cost?: string | null
  monthly_sponsorship?: string | null
  sponsor_id?: string | null
  sponsor_external?: string
  // Tab 4: Organization, Marketing & Status
  current_location?: string
  alternate_transport_trace?: string
  alternate_arrival_location?: string
  do_publish: boolean
  publish_description?: string | null
  compatibilities?: string[]
  personality_traits?: string[]
  application_url?: string | null
  is_deceased: boolean
  date_of_death?: string | null
}
