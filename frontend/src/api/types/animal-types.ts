// Mirrors: api/src/Http/Resources/AnimalTypeResource.php

// Mirrors: api/src/Enums/TiervermittlungSpecies.php
export type TiervermittlungSpecies =
  'dog' | 'cat' | 'small' | 'bird' | 'reptile' | 'horse' | 'fish' | 'other'

export interface AnimalTypeResource {
  id: string
  title: string
  // null keeps animals of this type out of the Tiervermittlung.de export
  tiervermittlung_species: TiervermittlungSpecies | null
  created_at: string
  updated_at: string
}
