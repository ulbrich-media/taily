export interface PublicInspectionPerson {
  id: string
  full_name: string
  street_line?: string
  street_line_additional?: string
  postal_code?: string
  city?: string
  country_code?: string
}

export interface PublicInspectionFormTemplate {
  id: string
  version_id: string
  schema: Record<string, unknown>
  ui_schema: Record<string, unknown> | null
}

export interface PublicInspection {
  id: string
  person: PublicInspectionPerson
  animal_type: {
    id: string
    title: string
  }
  pre_inspection_form_template: PublicInspectionFormTemplate | null
}

export interface SubmitInspectionRequest {
  verdict: 'approved' | 'rejected'
  notes?: string | null
  form_data?: Record<string, unknown>
  form_template_version_id?: string | null
}
