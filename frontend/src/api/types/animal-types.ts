// Mirrors: api/app/Http/Resources/AnimalTypeResource.php

import type { FormTemplateResource } from './form-templates'

export interface AnimalTypeResource {
  id: string
  title: string
  form_template_id: string | null
  created_at: string
  updated_at: string
  // Present when formTemplate is eager-loaded (always loaded in animal-type endpoints;
  // absent when AnimalType is nested inside another resource, e.g. AnimalListResource)
  form_template: FormTemplateResource | null
}
