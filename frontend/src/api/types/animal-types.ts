// Mirrors: api/app/Http/Resources/AnimalTypeResource.php

import type { FormTemplateResource } from './form-templates'

export interface AnimalTypeResource {
  id: string
  title: string
  pre_inspection_form_template_id: string | null
  created_at: string
  updated_at: string
  // Present when preInspectionFormTemplate is eager-loaded (always loaded in animal-type endpoints;
  // absent when AnimalType is nested inside another resource, e.g. AnimalListResource)
  pre_inspection_form_template: FormTemplateResource | null
}
