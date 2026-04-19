export interface PublicInspectionPerson {
  id: string
  full_name: string
  street_line?: string
  street_line_additional?: string
  postal_code?: string
  city?: string
  country_code?: string
}

export interface PublicInspection {
  id: string
  person: PublicInspectionPerson
  animal_type: {
    id: string
    title: string
  }
}

export interface SubmitInspectionRequest {
  verdict: 'approved' | 'rejected'
  notes?: string | null
}
