// Mirrors: api/app/Http/Resources/AnimalTypeResource.php

import type { FormTemplateResource } from './form-templates'

// Mirrors: api/src/Enums/TiervermittlungSpecies.php
export type TiervermittlungSpecies =
  | 'dog'
  | 'cat'
  | 'small'
  | 'bird'
  | 'reptile'
  | 'horse'
  | 'fish'
  | 'other'

export interface AnimalTypeResource {
  id: string
  title: string
  // null keeps animals of this type out of the Tiervermittlung.de export
  tiervermittlung_species: TiervermittlungSpecies | null
  pre_inspection_form_template_id: string | null
  created_at: string
  updated_at: string
  // Present when preInspectionFormTemplate is eager-loaded (always loaded in animal-type endpoints;
  // absent when AnimalType is nested inside another resource, e.g. AnimalListResource)
  pre_inspection_form_template: FormTemplateResource | null
}
